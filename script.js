/* [1. 페이지 관리자] - 섹션 로드 및 초기화 로직 */
const PageManager = {
    async load(pageName) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        try {
            const response = await fetch(`./sections/${pageName}.html`);
            if (!response.ok) throw new Error('파일 로드 실패');
            const html = await response.text();
            mainContent.innerHTML = html;
            mainContent.className = 'fade-in';

            window.scrollTo(0, 0);

            // 페이지별 특화 로직 실행
            switch (pageName) {
                case 'press':
                    allPressItems.length === 0 ? fetchPressData() : renderPressPage(1);
                    break;
                case 'instructor':
                    // 📍 시트 데이터를 먼저 가져오고 화면을 그립니다.
                    InstructorManager.fetchInstructorData(); 
                    break;
                case 'greetings': 
                    fetchGreetingsData();
                    break;
            }
            
            document.querySelectorAll('.tree-content').forEach(t => t.classList.remove('show'));
        } catch (e) {
            console.error("로드 실패:", e);
            if(pageName === 'home') {
                mainContent.innerHTML = "<div style='text-align:center; padding:100px;'>홈 화면을 로드하는 중...</div>";
                setTimeout(() => this.load('home'), 500);
            } else {
                mainContent.innerHTML = "<p style='text-align:center; padding:100px;'>페이지를 찾을 수 없습니다. 😥</p>";
            }
        }
    }
};

/* [2. 강사 관리자] - 슬라이더 및 데이터 관리 (구글 시트 연동형) */
const InstructorManager = {
    currentSlide: 0,
    currentType: 'main',
    data: {
        main: [],
        expert: []
    },
    // 📍 구글 시트에서 강사 데이터를 가져오는 함수 추가
    async fetchInstructorData() {
        try {
            const jsonData = await getSheetData(INSTRUCTOR_URL);
            const rows = jsonData.table.rows;
            
            this.data.main = [];
            this.data.expert = [];

            rows.slice(1).forEach(row => {
                const type = row.c[0]?.v; // A열: 타입 (main/expert)
                const item = {
                    name: row.c[1]?.v || "",  // B열: 이름
                    role: row.c[2]?.v || "",  // C열: 역할
                    img: row.c[3]?.v || "",   // D열: 이미지파일명
                    tags: row.c[4]?.v || ""   // E열: 태그
                };
                if (type === 'main') this.data.main.push(item);
                else if (type === 'expert') this.data.expert.push(item);
            });
            
            this.display(); // 데이터 로드 후 화면 표시
        } catch (e) {
            console.error("강사 데이터 로드 에러:", e);
            // 에러 시 기존 샘플 데이터라도 표시되도록 처리 가능
        }
    },
    loadAndDisplay(type) {
        this.currentType = type;
        PageManager.load('instructor');
    },
    display() {
        const container = document.getElementById('instructor-container');
        if (!container) return;

        const titleElement = document.querySelector('.section-title');
        if (titleElement) {
            titleElement.innerHTML = this.currentType === 'expert' ? '전임 <span>강사진</span>' : '대표 <span>강사진</span>';
        }

        const targetData = this.data[this.currentType];
        
        if (targetData.length === 0) {
            container.innerHTML = "<p style='text-align:center; width:100%; padding:50px;'>강사 정보를 불러오는 중입니다... 🚀</p>";
            return;
        }

        container.innerHTML = targetData.map(t => `
            <div class="card">
                <img src="img/${t.img}" alt="${t.name}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
                <h3>${t.name} <span class="highlight-role">${t.role}</span></h3>
                <div class="tag-container"><span class="tag">${t.tags}</span></div>
            </div>`).join('');
            
        this.currentSlide = 0;
        container.style.transform = `translateX(0px)`;
    },
    move(direction) {
        const container = document.getElementById('instructor-container');
        const cards = document.querySelectorAll('.card');
        if (!container || cards.length === 0) return;
        const step = cards[0].offsetWidth + 30;
        this.currentSlide += direction;
        const visible = window.innerWidth <= 768 ? 1 : 4;
        const max = this.data[this.currentType].length - visible;
        if (this.currentSlide < 0) this.currentSlide = 0;
        if (this.currentSlide > max) this.currentSlide = max;
        container.style.transform = `translateX(${-this.currentSlide * step}px)`;
    }
};

/* [3. UI 관리자] - 모달, 메뉴, 팝업 제어 */
const UIManager = {
    toggleMenu(event, treeId) {
        event.preventDefault();
        event.stopPropagation();
        const target = document.getElementById(treeId + '-tree');
        if (!target) return;
        const isOpen = target.classList.contains('show');
        document.querySelectorAll('.tree-content').forEach(t => t.classList.remove('show'));
        if (!isOpen) target.classList.add('show');
    },
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },
    openImageModal(imageSrc, title, text) {
        const bg = document.getElementById('modalBgContainer');
        const desc = document.getElementById('modalDescription');
        const titleEl = document.getElementById('modalTitle');
        if (bg && titleEl && desc) {
            bg.style.backgroundImage = `url('${imageSrc}')`;
            titleEl.innerText = title;
            desc.innerHTML = text; 
            this.openModal('imageModal');
        }
    },
    openExternalLink(url) {
        if (url) window.open(url, '_blank');
    }
};

/* [4. 데이터 연동] - 구글 시트 연동 로직 */
// 1. 보도자료 설정
const SHEET_ID = '1yGso1dSQuo41zRqlusV-Wbhy2uh9Q8DigBDo53YwgR8';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// 2. 협회장 인사말 설정
const GREETINGS_SHEET_ID = '1wXT3o4gRrLLxsuHLaYk3GgEA8nmc9UUShwlthtGlW4Y';
const GREETINGS_URL = `https://docs.google.com/spreadsheets/d/${GREETINGS_SHEET_ID}/gviz/tq?tqx=out:json`;

// 3. 강사 리스트 설정 (강사 시트 ID)
const INSTRUCTOR_SHEET_ID = '1iCXIPRnhN7adh6fFwgE3DoB0CT5SSsDReE-saP23bQ4';
const INSTRUCTOR_URL = `https://docs.google.com/spreadsheets/d/${INSTRUCTOR_SHEET_ID}/gviz/tq?tqx=out:json`;

let allPressItems = [];

// 공통 데이터 페치 함수
async function getSheetData(url) {
    const response = await fetch(url);
    const text = await response.text();
    return JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
}

// 보도자료 로드
async function fetchPressData() {
    try {
        const jsonData = await getSheetData(BASE_URL);
        allPressItems = jsonData.table.rows.slice(1).map(row => ({
            date: row.c[0]?.f || row.c[0]?.v || "",
            title: row.c[1]?.v || "",
            link: row.c[2]?.v || "#"
        }));
        renderPressPage(1);
    } catch (e) {
        console.error("보도자료 로드 에러:", e);
    }
}

// 협회장 인사말 로드
async function fetchGreetingsData() {
    const contentDiv = document.getElementById('greetings-content');
    if (!contentDiv) return;
    try {
        const jsonData = await getSheetData(GREETINGS_URL); 
        let greetingText = jsonData.table.rows[0]?.c[0]?.v || "인사말 내용을 작성해주세요. 😊";
        contentDiv.innerHTML = greetingText.replace(/\n/g, '<br>');
    } catch (e) {
        console.error("인사말 로드 에러:", e);
        contentDiv.innerHTML = "<p>인사말을 불러오지 못했습니다. 시트 공유 설정을 확인해주세요.</p>";
    }
}

function renderPressPage(page) {
    const grid = document.getElementById('pressGrid');
    if (!grid) return;
    if (!allPressItems || allPressItems.length === 0) {
        grid.innerHTML = "<p style='text-align:center; padding:50px;'>데이터를 불러오는 중입니다... 🚀</p>";
        fetchPressData();
        return;
    }
    const items = allPressItems.slice((page - 1) * 10, page * 10);
    grid.innerHTML = items.map(item => `
        <a href="${item.link}" target="_blank" class="press-card">
            <div class="press-date">${item.date}</div>
            <div class="press-content">${item.title}</div>
            <div class="press-tag">보도자료</div>
        </a>`).join('');
    renderPagination(page);
}

function renderPagination(currentPage) {
    const area = document.querySelector('.pagination');
    if(!area) return;
    const total = Math.ceil(allPressItems.length / 10);
    let html = `<span onclick="renderPressPage(1)">&laquo;</span>`;
    for (let i = 1; i <= total; i++) {
        html += `<span class="page-num ${i === currentPage ? 'active' : ''}" onclick="renderPressPage(${i})">${i}</span>`;
    }
    area.innerHTML = html + `<span onclick="renderPressPage(${total})">&raquo;</span>`;
}

/* [5. 이메일 전송 (EmailJS)] */
function sendEmail(event) {
    event.preventDefault();
    const btn = event.target.querySelector('.submit-btn');
    if(btn) btn.innerText = "전송 중...";

    // 📍 EmailJS 템플릿의 {{중괄호}} 안의 이름과 '완벽하게' 일치시켜야 합니다.
    const templateParams = {
        title: document.getElementById('subject').value,   // {{title}}에 매칭
        name: document.getElementById('sender').value,     // {{name}}에 매칭
        phone: document.getElementById('phone').value,     // {{phone}}에 매칭
        email: document.getElementById('email').value,     // {{email}}에 매칭
        content: document.getElementById('message').value  // {{content}}에 매칭
    };

    emailjs.send("service_153cti7", "template_izxmowt", templateParams)
    .then(() => {
        alert("접수되었습니다! 곧 연락드리겠습니다. 😊");
        UIManager.closeModal('contactModal');
        event.target.reset();
        if(btn) btn.innerText = "제출하기";
    }).catch(err => {
        alert("전송 실패: " + JSON.stringify(err)); // 에러 내용을 더 자세히 출력
        if(btn) btn.innerText = "제출하기";
    });
}

/* [6. 유틸리티 및 이벤트 리스너] */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') emailjs.init("JdkbG9fav2h4LOu9B");
    PageManager.load('home');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.tree-menu')) {
        document.querySelectorAll('.tree-content').forEach(t => t.classList.remove('show'));
    }
});

document.addEventListener('keydown', (e) => {
    const textarea = document.getElementById('message');
    if (e.target === textarea && e.key === 'Enter') {
        const text = textarea.value;
        const cursorPosition = textarea.selectionStart;
        const nextColonIndex = text.indexOf(':', cursorPosition);
        if (nextColonIndex !== -1) {
            e.preventDefault(); 
            const newPos = nextColonIndex + 2;
            textarea.setSelectionRange(newPos, newPos);
            textarea.focus();
        }
    }
});