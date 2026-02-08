/* [1. 페이지 관리자] - 섹션 로드 및 애니메이션 */
const PageManager = {
    async load(pageName) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        try {
            const response = await fetch(`sections/${pageName}.html`);
            if (!response.ok) throw new Error('파일 로드 실패');
            
            const html = await response.text();
            mainContent.innerHTML = html;

            mainContent.classList.remove('fade-in'); 
            void mainContent.offsetWidth; 
            mainContent.classList.add('fade-in');

            window.scrollTo(0, 0);

            if (pageName === 'press') fetchPressData(); 
            if (pageName === 'instructor') InstructorManager.display();
            
        } catch (e) {
            console.error("로드 실패:", e);
            mainContent.innerHTML = "<p style='text-align:center; padding:50px;'>페이지를 찾을 수 없습니다. 😥</p>";
        }
    }
};

/* [2. UI 관리자] - 모달 정밀 제어 */
const UIManager = {
    openImageModal(imageSrc, title, text) {
        const bgContainer = document.getElementById('modalBgContainer');
        if (bgContainer) {
            bgContainer.style.backgroundImage = `url('${imageSrc}')`;
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDescription').innerHTML = text;
            this.openModal('imageModal');
        }
    },
    openModal(id) {
        const modal = document.getElementById(id);
        if(modal) {
            // CSS의 display: none !important를 이기는 인라인 스타일 부여
            modal.style.setProperty('display', 'flex', 'important'); 
            document.body.style.overflow = 'hidden';
        }
    },
    closeModal(id) {
        const modal = document.getElementById(id);
        if(modal) {
            modal.style.setProperty('display', 'none', 'important');
            document.body.style.overflow = 'auto';
        }
    }
};

/* [3. 초기 실행 설정 - 홈 화면 즉시 로딩 보강] */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') emailjs.init("JdkbG9fav2h4LOu9B");
    
    const initApp = () => {
        if (document.getElementById('main-content')) {
            PageManager.load('home');
        } else {
            setTimeout(initApp, 50);
        }
    };
    initApp();
});

/* [4. 나머지 기능 - 보도자료/강사 관리자 원복 유지] */
function sendEmail(event) {
    event.preventDefault(); 
    const btn = event.target.querySelector('.submit-btn');
    const originalText = btn.innerText;
    btn.innerText = "전송 중... 🚀";
    
    const params = {
        title: document.getElementById('subject').value,
        name: document.getElementById('sender').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        content: document.getElementById('message').value
    };

    emailjs.send("service_153cti7", "template_izxmowt", params)
        .then(() => {
            alert("문의가 성공적으로 접수되었습니다! 😊");
            UIManager.closeModal('contactModal');
            event.target.reset();
            btn.innerText = originalText;
        }, () => {
            alert("전송 실패 😥");
            btn.innerText = originalText;
        });
}

const SHEET_ID = '1yGso1dSQuo41zRqlusV-Wbhy2uh9Q8DigBDo53YwgR8';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
let allPressItems = [];

async function fetchPressData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substring(47, text.length - 2));
        allPressItems = jsonData.table.rows.slice(1).map(row => ({
            date: row.c[0]?.f || row.c[0]?.v || "",
            title: row.c[1]?.v || "",
            link: row.c[2]?.v || "#"
        }));
        renderPressPage(1);
    } catch (e) { console.error(e); }
}

function renderPressPage(page) {
    const grid = document.getElementById('pressGrid');
    if (!grid) return;
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

const InstructorManager = {
    data: [
        { name: "서순례", role: "협회장", img: "tea1.png", tags: "#생성형 AI활용 #스마트폰 활용 #시니어 디지털리터러시" },
        { name: "하연지", role: "부회장", img: "tea3.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" },
        { name: "송귀옥", role: "부회장", img: "tea4.png", tags: "#스마트폰 활용 #영상제작 #시니어 디지털리터러시" },
        { name: "이혜진", role: "교육이사", img: "tea2.png", tags: "#AI #데이터 분석 #자동화 #바이브코딩 #시각화" }, 
        { name: "홍은희", role: "교육이사", img: "tea6.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" },
        { name: "서정주", role: "홍보이사", img: "tea5.png", tags: "#스마트폰 활용 #AI #시니어 디지털리터러시" }
    ],
    display() {
        const container = document.getElementById('instructor-container');
        if (!container) return;
        container.innerHTML = this.data.map(t => `
            <div class="card">
                <img src="img/${t.img}" alt="${t.name}" onerror="this.src='https://via.placeholder.com/300x250'">
                <h3>${t.name} <span class="highlight-role">${t.role}</span></h3>
                <div class="tag-container"><span class="tag">${t.tags}</span></div>
            </div>`).join('');
        container.style.transform = `translateX(0px)`;
    },
    move(direction) {
        const container = document.getElementById('instructor-container');
        const cards = document.querySelectorAll('.card');
        if (!container || !cards[0]) return;
        const step = cards[0].offsetWidth + 30;
        this.currentSlide = (this.currentSlide || 0) + direction;
        const max = this.data.length - (window.innerWidth <= 768 ? 1 : 3);
        if (this.currentSlide < 0) this.currentSlide = 0;
        if (this.currentSlide > max) this.currentSlide = max;
        container.style.transform = `translateX(${-this.currentSlide * step}px)`;
    }
};

window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTop');
    if (btn) btn.style.display = window.scrollY > 200 ? 'flex' : 'none';
});