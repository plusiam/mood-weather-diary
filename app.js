// Google Apps Script 배포 URL (배포 후 이 부분을 실제 URL로 교체하세요!)
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwswLYBXIwTvryhocMiR0aGXvw2TIIiaxXl4wXzq4W0oqXemy62IQxkpCVrfhOyuEob/exec';

  // 페이지 로드 시 저장된 정보 복원
  window.addEventListener('load', function() {
      const savedName = localStorage.getItem('studentName');
      const savedClass = localStorage.getItem('studentClass');

      if (savedName) document.getElementById('studentName').value = savedName;
      if (savedClass) document.getElementById('studentClass').value = savedClass;
  });

  // 입력값 저장
  document.getElementById('studentName').addEventListener('input', function() {
      localStorage.setItem('studentName', this.value);
  });

  document.getElementById('studentClass').addEventListener('input', function() {
      localStorage.setItem('studentClass', this.value);
  });

  // 학생 정보 가져오기
  function getStudentInfo() {
      const name = document.getElementById('studentName').value.trim();
      const studentClass = document.getElementById('studentClass').value.trim();

      if (!name || !studentClass) {
          alert('이름과 학반을 입력해주세요!');
          return null;
      }

      // 세션 스토리지에 저장 (페이지 이동 시 사용)
      sessionStorage.setItem('studentName', name);
      sessionStorage.setItem('studentClass', studentClass);

      return { name, studentClass };
  }

  // 일기 페이지로 이동
  function goToDiary(mode) {
      const info = getStudentInfo();
      if (!info) return;

      showLoading(event.target);

      if (mode === 'write') {
          window.location.href = `${APPS_SCRIPT_URL}?page=index&new=true`;
      } else {
          window.location.href = `${APPS_SCRIPT_URL}?page=index&view=true`;
      }
  }

  // 오늘 작성 확인
  function checkStatus() {
      const info = getStudentInfo();
      if (!info) return;

      showLoading(event.target);
      window.location.href = `${APPS_SCRIPT_URL}?page=index&status=true`;
  }

  // 교사 페이지로 이동
  function goToTeacher() {
      const password = prompt('선생님 비밀번호를 입력하세요:');
      if (password) {
          window.location.href = `${APPS_SCRIPT_URL}?page=teacher&password=${encodeURIComponent(password)}`;
      }
  }

  // 로딩 표시
  function showLoading(element) {
      if (element && element.classList.contains('btn')) {
          const originalContent = element.innerHTML;
          element.innerHTML = '<span class="loading"></span> 연결중...';
          element.disabled = true;
      }
  }

  // 엔터키로 일기 쓰기
  document.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
          const activeElement = document.activeElement;
          if (activeElement.id === 'studentName' || activeElement.id === 'studentClass') {
              goToDiary('write');
          }
      }
  });

  // 초기 애니메이션
  document.addEventListener('DOMContentLoaded', function() {
      document.querySelector('.container').style.opacity = '1';
  });
