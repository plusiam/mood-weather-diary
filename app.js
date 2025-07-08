// Google Apps Script 배포 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwswLYBXIwTvryhocMiR0aGXvw2TIIiaxXl4wXzq4W0oqXemy62IQxkpCVrfhOyuEob/exec';

// 페이지 로드 시 저장된 정보 복원
window.addEventListener('load', function() {
    const savedName = localStorage.getItem('studentName');
    const savedClass = localStorage.getItem('studentClass');

    if (savedName) document.getElementById('studentName').value = savedName;
    if (savedClass) document.getElementById('studentClass').value = savedClass;
});

// 입력값 저장
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('studentName');
    const classInput = document.getElementById('studentClass');
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            localStorage.setItem('studentName', this.value);
        });
    }
    
    if (classInput) {
        classInput.addEventListener('input', function() {
            localStorage.setItem('studentClass', this.value);
        });
    }
});

// 학생 정보 가져오기
function getStudentInfo() {
    const name = document.getElementById('studentName')?.value?.trim();
    const studentClass = document.getElementById('studentClass')?.value?.trim();

    if (!name || !studentClass) {
        alert('이름과 학반을 입력해주세요!');
        return null;
    }

    return { name, studentClass };
}

// 일기 페이지로 이동
function goToDiary(mode) {
    const info = getStudentInfo();
    if (!info) return;

    const button = event?.target;
    showLoading(button);

    if (!checkNetworkConnection()) {
        hideLoading(button);
        return;
    }

    try {
        // URL 파라미터로 학생 정보 전달
        const params = new URLSearchParams({
            page: 'student',
            mode: mode,
            name: info.name,
            studentClass: info.studentClass
        });

        window.location.href = `${APPS_SCRIPT_URL}?${params.toString()}`;
    } catch (error) {
        console.error('페이지 이동 중 오류:', error);
        hideLoading(button);
        alert('페이지 이동 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 오늘 작성 확인
function checkStatus() {
    const info = getStudentInfo();
    if (!info) return;

    const button = event?.target;
    showLoading(button);

    if (!checkNetworkConnection()) {
        hideLoading(button);
        return;
    }

    try {
        const params = new URLSearchParams({
            page: 'student',
            mode: 'status',
            name: info.name,
            studentClass: info.studentClass
        });

        window.location.href = `${APPS_SCRIPT_URL}?${params.toString()}`;
    } catch (error) {
        console.error('상태 확인 중 오류:', error);
        hideLoading(button);
        alert('상태 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 교사 페이지로 이동
function goToTeacher() {
    try {
        const password = prompt('선생님 비밀번호를 입력하세요:');
        if (password) {
            showLoading(event?.target);
            
            if (!checkNetworkConnection()) {
                hideLoading(event?.target);
                return;
            }
            
            const params = new URLSearchParams({
                page: 'teacher',
                password: password
            });
            window.location.href = `${APPS_SCRIPT_URL}?${params.toString()}`;
        }
    } catch (error) {
        console.error('교사 페이지 이동 중 오류:', error);
        alert('교사 페이지 이동 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 로딩 표시
function showLoading(element) {
    if (element && element.classList && element.classList.contains('btn')) {
        const originalContent = element.innerHTML;
        element.setAttribute('data-original-content', originalContent);
        element.innerHTML = '<span class="loading"></span> 연결중...';
        element.disabled = true;
        element.style.opacity = '0.7';
    }
}

// 로딩 숨기기
function hideLoading(element) {
    if (element && element.hasAttribute('data-original-content')) {
        element.innerHTML = element.getAttribute('data-original-content');
        element.removeAttribute('data-original-content');
        element.disabled = false;
        element.style.opacity = '1';
    }
}

// 네트워크 상태 체크
function checkNetworkConnection() {
    if (!navigator.onLine) {
        alert('인터넷 연결을 확인해주세요.');
        return false;
    }
    return true;
}

// 엔터키로 일기 쓰기
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'studentName' || activeElement.id === 'studentClass')) {
            e.preventDefault();
            if (checkNetworkConnection()) {
                goToDiary('write');
            }
        }
    }
});

// 초기 애니메이션
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드 완료 후 애니메이션
    setTimeout(() => {
        const container = document.querySelector('.container');
        if (container) {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }
    }, 100);
    
    // 네트워크 상태 모니터링
    window.addEventListener('online', function() {
        console.log('네트워크 연결됨');
    });
    
    window.addEventListener('offline', function() {
        console.log('네트워크 연결 끊어짐');
        alert('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.');
    });
});

// 페이지 이탈 전 데이터 저장
window.addEventListener('beforeunload', function(e) {
    const name = document.getElementById('studentName')?.value;
    const studentClass = document.getElementById('studentClass')?.value;
    
    if (name || studentClass) {
        if (name) localStorage.setItem('studentName', name);
        if (studentClass) localStorage.setItem('studentClass', studentClass);
    }
});

// 에러 전역 처리
window.addEventListener('error', function(e) {
    console.error('전역 에러:', e.error);
    if (e.error && e.error.message && e.error.message.includes('network')) {
        alert('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    }
});

// 앱 정보
console.log('마음날씨 일기 v2.2 - 심플 버전');
console.log('GitHub Pages + Google Apps Script 연동');
