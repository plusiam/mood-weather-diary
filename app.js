// Google Apps Script 배포 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwswLYBXIwTvryhocMiR0aGXvw2TIIiaxXl4wXzq4W0oqXemy62IQxkpCVrfhOyuEob/exec';

// 페이지 로드 시 저장된 정보 복원
window.addEventListener('load', function() {
    const savedName = localStorage.getItem('studentName');
    const savedClass = localStorage.getItem('studentClass');

    if (savedName) document.getElementById('studentName').value = savedName;
    if (savedClass) document.getElementById('studentClass').value = savedClass;
    
    // 최근 활동 로드
    loadRecentActivity();
});

// 입력값 저장
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('studentName');
    const classInput = document.getElementById('studentClass');
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            localStorage.setItem('studentName', this.value);
            updateRecentActivity();
        });
    }
    
    if (classInput) {
        classInput.addEventListener('input', function() {
            localStorage.setItem('studentClass', this.value);
            updateRecentActivity();
        });
    }
});

// 학생 정보 가져오기 (개선됨)
function getStudentInfo() {
    const name = document.getElementById('studentName')?.value?.trim();
    const studentClass = document.getElementById('studentClass')?.value?.trim();

    if (!name || !studentClass) {
        alert('이름과 학반을 입력해주세요!');
        return null;
    }

    return { name, studentClass };
}

// 일기 페이지로 이동 (개선됨)
function goToDiary(mode) {
    const info = getStudentInfo();
    if (!info) return;

    const button = event?.target;
    showLoading(button);

    try {
        // 최근 활동 업데이트
        updateLastAccess();
        
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

// 빠른 작성 (새로 추가)
function quickWrite() {
    const info = getStudentInfo();
    if (!info) return;

    // 빠른 작성 알림
    if (confirm('빠른 작성으로 일기를 시작하시겠습니까?\n간단한 템플릿으로 빠르게 작성할 수 있습니다.')) {
        goToDiary('quick');
    }
}

// 이어서 작성 (새로 추가)
function continueWriting() {
    const info = getStudentInfo();
    if (!info) return;

    // 미완성 일기가 있는지 확인
    const unfinishedDiary = localStorage.getItem(`unfinished_${info.name}_${info.studentClass}`);
    
    if (unfinishedDiary) {
        if (confirm('저장하지 않은 일기가 있습니다. 이어서 작성하시겠습니까?')) {
            goToDiary('continue');
        }
    } else {
        alert('이어서 작성할 일기가 없습니다.\n새로운 일기를 작성해주세요!');
    }
}

// 어제 일기 복사 (새로 추가)
function copyLastDiary() {
    const info = getStudentInfo();
    if (!info) return;

    if (confirm('어제 작성한 일기를 복사해서 새로 작성하시겠습니까?\n내용을 수정하여 오늘 일기로 만들 수 있습니다.')) {
        goToDiary('copy');
    }
}

// 음성으로 작성 (새로 추가)
function voiceWrite() {
    const info = getStudentInfo();
    if (!info) return;

    // 음성 인식 지원 확인
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.\n크롬 브라우저를 사용해주세요.');
        return;
    }

    if (confirm('음성으로 일기를 작성하시겠습니까?\n마이크 권한이 필요합니다.')) {
        goToDiary('voice');
    }
}

// 오늘 작성 확인 (개선됨)
function checkStatus() {
    const info = getStudentInfo();
    if (!info) return;

    const button = event?.target;
    showLoading(button);

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

// 최근 일기 보기 (새로 추가)
function showRecentDiaries() {
    const info = getStudentInfo();
    if (!info) return;

    goToDiary('view');
}

// 교사 페이지로 이동 (개선됨)
function goToTeacher() {
    try {
        const password = prompt('선생님 비밀번호를 입력하세요:');
        if (password) {
            showLoading(event?.target);
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

// 최근 활동 로드 (새로 추가)
function loadRecentActivity() {
    const name = localStorage.getItem('studentName');
    const studentClass = localStorage.getItem('studentClass');
    
    if (name && studentClass) {
        const lastAccess = localStorage.getItem(`lastAccess_${name}_${studentClass}`);
        const recentActivityCard = document.getElementById('recentActivityCard');
        const recentActivityContent = document.getElementById('recentActivityContent');
        
        if (recentActivityCard && recentActivityContent) {
            recentActivityCard.style.display = 'block';
            
            if (lastAccess) {
                const lastDate = new Date(lastAccess);
                const today = new Date();
                const diffTime = today.getTime() - lastDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let activityText = '';
                if (diffDays === 0) {
                    activityText = '오늘 일기를 확인했어요!';
                } else if (diffDays === 1) {
                    activityText = '어제 일기를 작성했어요.';
                } else {
                    activityText = `${diffDays}일 전에 일기를 작성했어요.`;
                }
                
                recentActivityContent.innerHTML = `
                    <p class="activity-item">
                        <span class="activity-date">${formatDate(lastDate)}</span>
                        <span class="activity-text">${activityText}</span>
                    </p>
                `;
            } else {
                recentActivityContent.innerHTML = `
                    <p class="activity-item">
                        <span class="activity-date">처음 방문</span>
                        <span class="activity-text">마음날씨 일기에 오신 것을 환영합니다!</span>
                    </p>
                `;
            }
        }
    }
}

// 최근 활동 업데이트 (새로 추가)
function updateRecentActivity() {
    setTimeout(loadRecentActivity, 100); // 입력 완료 후 업데이트
}

// 마지막 접근 시간 업데이트 (새로 추가)
function updateLastAccess() {
    const name = localStorage.getItem('studentName');
    const studentClass = localStorage.getItem('studentClass');
    
    if (name && studentClass) {
        localStorage.setItem(`lastAccess_${name}_${studentClass}`, new Date().toISOString());
    }
}

// 날짜 포맷 함수 (새로 추가)
function formatDate(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
    });
}

// 로딩 표시 (개선됨)
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

// 엔터키로 일기 쓰기 (개선됨)
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

// 키보드 단축키 (새로 추가)
document.addEventListener('keydown', function(e) {
    // Ctrl+N: 새로 쓰기
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const info = getStudentInfo();
        if (info) goToDiary('write');
    }
    
    // Ctrl+D: 내 일기 보기
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const info = getStudentInfo();
        if (info) goToDiary('view');
    }
    
    // Ctrl+S: 상태 확인
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        checkStatus();
    }
});

// 초기 애니메이션 (개선됨)
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
        showToast('인터넷에 연결되었습니다.', 'success');
    });
    
    window.addEventListener('offline', function() {
        console.log('네트워크 연결 끊어짐');
        showToast('인터넷 연결이 끊어졌습니다.', 'warning');
    });
});

// 토스트 메시지 (새로 추가)
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => toast.classList.add('toast-show'), 100);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 페이지 이탈 전 데이터 저장
window.addEventListener('beforeunload', function(e) {
    const name = document.getElementById('studentName')?.value;
    const studentClass = document.getElementById('studentClass')?.value;
    
    if (name || studentClass) {
        if (name) localStorage.setItem('studentName', name);
        if (studentClass) localStorage.setItem('studentClass', studentClass);
        updateLastAccess();
    }
});

// 에러 전역 처리
window.addEventListener('error', function(e) {
    console.error('전역 에러:', e.error);
    if (e.error && e.error.message && e.error.message.includes('network')) {
        showToast('네트워크 오류가 발생했습니다.', 'error');
    }
});

// 앱 정보
console.log('마음날씨 일기 v2.1 - 새로쓰기 기능 강화');
console.log('GitHub Pages + Google Apps Script 연동');
console.log('키보드 단축키: Ctrl+N(새로쓰기), Ctrl+D(내일기), Ctrl+S(상태확인)');
