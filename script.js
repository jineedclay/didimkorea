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
                    InstructorManager.display();
                    break;
                case 'greetings': // 📍 협회장 인사말 데이터 로드 추가
                    fetchGreetingsData();
                    break;
            }
            
            // 페이지 이동 시 열려있는 드롭다운 메뉴 닫기
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

/* [2. 강사 관리자] - 슬라이더 및 데이터 관리 */
const InstructorManager = {
    currentSlide: 0,
    currentType: 'main',
    data: {
        main: [
            { name: "서순례", role: "협회장", img: "tea1.png", tags: "#생성형 AI활용 #스마트폰 활용 #시니어 디지털리터러시" },
            { name: "하연지", role: "부회장", img: "tea3.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" },
            { name: "송귀옥", role: "부회장", img: "tea4.png", tags: "#영상제작 #시니어디지털 #스마트폰 활용" },
            { name: "이혜진", role: "교육이사", img: "tea2.png", tags: "#AI #A마케팅 #AI윤리 #데이터 분석 #자동화 #바이브코딩 #시각화" }, 
            { name: "홍은희", role: "교육이사", img: "tea6.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" },
            { name: "서정주", role: "홍보이사", img: "tea5.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" }
        ],
        expert: [
            { name: "김옥진", role: "선임연구원", img: "tea7.png", tags: "#특화분야 #디지털교육" },
            { name: "이연희", role: "책임연구원", img: "tea8.png", tags: "#AI실무 #데이터분석" }
        ]
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

// 📍 중복 선언 하나만 남기고 제거했습니다.
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

// 협회장 인사말 로드 (줄바꿈 최적화 반영)
async function fetchGreetingsData() {
    const contentDiv = document.getElementById('greetings-content');
    if (!contentDiv) return;
    try {
        const jsonData = await getSheetData(GREETINGS_URL); 
        // 시트의 첫 번째 칸(A1) 내용을 가져옵니다.
        let greetingText = jsonData.table.rows[0]?.c[0]?.v || "인사말 내용을 작성해주세요. 😊";
        
        // 📍 줄바꿈이 정상적으로 보이도록 <br> 태그로 변환하여 넣습니다.
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

    emailjs.send("service_153cti7", "template_izxmowt", {
        subject: document.getElementById('subject').value,
        sender: document.getElementById('sender').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    }).then(() => {
        alert("접수되었습니다! 곧 연락드리겠습니다. 😊");
        UIManager.closeModal('contactModal');
        event.target.reset();
        if(btn) btn.innerText = "제출하기";
    }).catch(err => {
        alert("전송 실패: " + err);
        if(btn) btn.innerText = "제출하기";
    });
}

/* [6. 유틸리티 및 이벤트 리스너] */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') emailjs.init("JdkbG9fav2h4LOu9B");
    PageManager.load('home');
});

// 메뉴 외부 클릭 시 닫기 및 엔터 키 커서 이동 통합
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