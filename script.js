/* [1. 페이지 관리자] - 섹션 로드 및 애니메이션 담당 */
const PageManager = {
    async load(pageName) {
        const mainContent = document.getElementById('main-content');
        try {
            const response = await fetch(`sections/${pageName}.html`);
            if (!response.ok) throw new Error('파일 로드 실패');
            
            const html = await response.text();
            mainContent.innerHTML = html;

            // 페이지 전환 애니메이션 적용
            mainContent.classList.remove('fade-in'); 
            void mainContent.offsetWidth; // 브라우저 강제 리프레시
            mainContent.classList.add('fade-in');

            window.scrollTo(0, 0);

            // 페이지별 특수 로직 실행
            if (pageName === 'press') fetchPressData(); 
            if (pageName === 'instructor') InstructorManager.display();
            
        } catch (e) {
            console.error("로드 실패:", e);
            mainContent.innerHTML = "<p style='text-align:center; padding:50px;'>페이지를 찾을 수 없습니다. 😥</p>";
        }
    }
};

/* [2. UI 관리자] - 모달 및 외부 링크 */
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
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    },
    closeModal(id) {
        const modal = document.getElementById(id);
        if(modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },
    openExternalLink(url) {
        if(url) window.open(url, '_blank');
    }
};

/* [3. 이메일 전송 로직] - EmailJS 연동 (쌤의 템플릿 변수명에 맞춤) */
function sendEmail(event) {
    event.preventDefault(); 
    const btn = event.target.querySelector('.submit-btn');
    const originalText = btn.innerText;
    btn.innerText = "전송 중... 🚀";
    
    const templateParams = {
        title: document.getElementById('subject').value,
        name: document.getElementById('sender').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        content: document.getElementById('message').value
    };

    emailjs.send("service_153cti7", "template_izxmowt", templateParams)
        .then(() => {
            alert("문의가 성공적으로 접수되었습니다! 😊");
            UIManager.closeModal('contactModal');
            event.target.reset();
            btn.innerText = originalText;
        }, (error) => {
            alert("전송 실패 😥");
            btn.innerText = originalText;
        });
}

/* [4. 보도자료 로직] */
const SHEET_ID = '1yGso1dSQuo41zRqlusV-Wbhy2uh9Q8DigBDo53YwgR8';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
let allPressItems = [];
let currentPage = 1;
const itemsPerPage = 10;

async function fetchPressData() {
    const grid = document.getElementById('pressGrid');
    if(!grid) return;
    grid.innerHTML = "<p style='text-align:center; width:100%;'>데이터 로딩 중... 🚀</p>";
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substring(47, text.length - 2));
        allPressItems = jsonData.table.rows.slice(1).map(row => ({
            date: row.c[0] ? row.c[0].f || row.c[0].v : "",
            title: row.c[1] ? row.c[1].v : "",
            link: row.c[2] ? row.c[2].v : "#"
        }));
        renderPressPage(1);
    } catch (e) { grid.innerHTML = "<p>데이터 로드 실패 😥</p>"; }
}

function renderPressPage(page) {
    currentPage = page;
    const grid = document.getElementById('pressGrid');
    const startIndex = (page - 1) * itemsPerPage;
    const pageItems = allPressItems.slice(startIndex, startIndex + itemsPerPage);
    grid.innerHTML = pageItems.map(item => `
        <a href="${item.link}" target="_blank" class="press-card">
            <div class="press-date">${item.date}</div>
            <div class="press-content">${item.title}</div>
            <div class="press-tag">보도자료</div>
        </a>`).join('');
    renderPagination();
}

function renderPagination() {
    const area = document.querySelector('.pagination');
    if(!area) return;
    const total = Math.ceil(allPressItems.length / itemsPerPage);
    let html = `<span class="page-btn" onclick="renderPressPage(1)">&laquo;</span>`;
    for (let i = 1; i <= total; i++) {
        html += `<span class="page-num ${i === currentPage ? 'active' : ''}" onclick="renderPressPage(${i})">${i}</span>`;
    }
    html += `<span class="page-btn" onclick="renderPressPage(${total})">&raquo;</span>`;
    area.innerHTML = html;
}

/* [5. 강사 관리자] */
const InstructorManager = {
    currentSlide: 0,
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
                <img src="img/${t.img}" alt="${t.name}" onerror="this.src='https://via.placeholder.com/300x250?text=Preparing'">
                <h3>${t.name} <span class="highlight-role">${t.role}</span></h3>
                <div class="tag-container"><span class="tag">${t.tags}</span></div>
            </div>
        `).join('');
        this.currentSlide = 0;
        container.style.transform = `translateX(0px)`;
    },
    move(direction) {
        const container = document.getElementById('instructor-container');
        const cards = document.querySelectorAll('.card');
        if (!container || cards.length === 0) return;
        const stepWidth = cards[0].getBoundingClientRect().width + 30;
        const visibleCount = window.innerWidth <= 768 ? 1 : 3;
        const maxSlide = cards.length - visibleCount;
        this.currentSlide += direction;
        if (this.currentSlide < 0) this.currentSlide = 0;
        if (this.currentSlide > maxSlide) this.currentSlide = maxSlide;
        container.style.transform = `translateX(${-this.currentSlide * stepWidth}px)`;
    }
};

/* [6. 초기 실행 설정] */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') emailjs.init("JdkbG9fav2h4LOu9B");
    PageManager.load('home'); // 초기 화면 로드
});

window.addEventListener('scroll', () => {
    const topBtn = document.getElementById('backToTop');
    if (topBtn) topBtn.style.display = window.scrollY > 200 ? 'flex' : 'none';
});