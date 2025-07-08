/**
 * 마음날씨 일기 - Google Apps Script 서버
 * 학생들의 일기 데이터를 Google Sheets에 저장하고 관리
 */

// ⚙️ 설정
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Google Sheets ID 입력 필요
const TEACHER_PASSWORD = 'teacher2025'; // 교사 접근 비밀번호

/**
 * 내 일기 가져오기 (최종 수정된 버전 - 학반 반영)
 * @param {string} name - 학생 이름
 * @param {string} studentClass - 학반 (다양한 형태 지원)
 * @returns {Object} 결과 객체
 */
function getMyDiaries(name, studentClass) {
  try {
    console.log('=== getMyDiaries 시작 ===');
    console.log('입력값 - 이름:', name, '학반:', studentClass);
    
    // 입력값 검증
    if (!name || !studentClass) {
      return { success: false, message: '이름과 학반이 필요합니다.' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('일기데이터');
    
    if (!sheet) {
      console.log('일기데이터 시트가 없습니다.');
      return { success: false, message: '일기 데이터 시트를 찾을 수 없습니다.' };
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('전체 데이터 행 수:', values.length);
    if (values.length > 0) {
      console.log('헤더:', values[0]);
    }
    
    const myDiaries = [];

    // 헤더 제외하고 검색 (인덱스 1부터 시작)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // 데이터 유효성 검사 - 필수 컬럼이 비어있으면 건너뛰기
      if (!row[1] || !row[2]) {
        console.log(`행 ${i}: 이름 또는 학반이 비어있음`);
        continue;
      }
      
      // 스프레드시트 구조:
      // A(0): 타임스탬프, B(1): 이름, C(2): 학반, D(3): 날짜, 
      // E(4): 감정날씨, F(5): 세부감정, G(6): 일기내용, H(7): 상태
      
      const rowName = String(row[1]).trim();        // B컬럼: 이름
      const rowClass = String(row[2]).trim();       // C컬럼: 학반 (3-1 형태)
      const inputName = String(name).trim();
      const inputClass = normalizeClass(String(studentClass).trim()); // 학반 정규화
      const normalizedRowClass = normalizeClass(rowClass); // 저장된 학반도 정규화
      
      console.log(`행 ${i} 비교:`);
      console.log(`  스프레드시트: 이름="${rowName}", 학반="${rowClass}" → "${normalizedRowClass}"`);
      console.log(`  입력값: 이름="${inputName}", 학반="${studentClass}" → "${inputClass}"`);
      
      // 이름과 정규화된 학반이 일치하는 경우 (대소문자 구분 없이)
      if (rowName.toLowerCase() === inputName.toLowerCase() && 
          normalizedRowClass === inputClass) {
        
        console.log('✓ 일치하는 일기 발견!');
        
        const diaryEntry = {
          timestamp: row[0],              // A컬럼: 타임스탬프
          date: row[3],                   // D컬럼: 날짜  
          emotion: row[4],                // E컬럼: 감정날씨
          subEmotion: row[5] || '',       // F컬럼: 세부감정
          content: row[6],                // G컬럼: 일기내용
          status: row[7] || '저장됨'      // H컬럼: 상태
        };
        
        console.log('추가된 일기:', diaryEntry);
        myDiaries.push(diaryEntry);
      } else {
        // 디버깅을 위한 로그 (매칭 실패 시)
        console.log(`  → 매칭 실패`);
      }
    }

    console.log(`총 찾은 일기 수: ${myDiaries.length}`);

    // 최신순으로 정렬 (날짜 기준)
    myDiaries.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // 최신순
    });

    console.log('=== getMyDiaries 완료 ===');

    return { 
      success: true, 
      data: myDiaries,
      message: `${myDiaries.length}개의 일기를 찾았습니다.`
    };
    
  } catch (error) {
    console.error('getMyDiaries 오류:', error);
    return { 
      success: false, 
      message: '일기를 불러오는 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

/**
 * 학반 정규화 함수
 * 다양한 입력 형태를 표준 "학년-반" 형태로 변환
 * @param {string} input - 입력된 학반 정보
 * @returns {string} 정규화된 학반 (예: "3-1")
 */
function normalizeClass(input) {
  if (!input) return '';
  
  const trimmed = String(input).trim();
  
  // 이미 표준 형태 (3-1)
  if (/^\d+-\d+$/.test(trimmed)) {
    return trimmed;
  }
  
  // 학번 형태 (3-1-15) → 3-1 추출
  if (/^\d+-\d+-\d+$/.test(trimmed)) {
    const parts = trimmed.split('-');
    return `${parts[0]}-${parts[1]}`;
  }
  
  // 한글 형태 (3학년 1반, 3학년1반) → 3-1
  const koreanMatch = trimmed.match(/(\d+).*?(\d+)/);
  if (koreanMatch) {
    return `${koreanMatch[1]}-${koreanMatch[2]}`;
  }
  
  // 공백 구분 (3 1) → 3-1
  const spaceMatch = trimmed.match(/^(\d+)\s+(\d+)$/);
  if (spaceMatch) {
    return `${spaceMatch[1]}-${spaceMatch[2]}`;
  }
  
  // 변환 불가능한 경우 원본 반환
  console.log('학반 정규화 실패:', input);
  return trimmed;
}

/**
 * 일기 저장하기
 * @param {Object} diaryData - 일기 데이터
 * @returns {Object} 결과 객체
 */
function saveDiary(diaryData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('일기데이터');
    
    if (!sheet) {
      return { success: false, message: '일기데이터 시트를 찾을 수 없습니다.' };
    }
    
    // 학반 정규화
    const normalizedClass = normalizeClass(diaryData.studentClass);
    
    const timestamp = new Date();
    const rowData = [
      timestamp,                    // A: 타임스탬프
      diaryData.name,               // B: 이름
      normalizedClass,              // C: 학반 (정규화됨)
      diaryData.date,               // D: 날짜
      diaryData.emotion,            // E: 감정날씨
      diaryData.subEmotion || '',   // F: 세부감정
      diaryData.content,            // G: 일기내용
      '저장됨'                      // H: 상태
    ];
    
    sheet.appendRow(rowData);
    
    // 통계 업데이트
    updateDailyStats();
    updateStudentStats();
    
    return { 
      success: true, 
      message: '일기가 성공적으로 저장되었습니다! 📝' 
    };
    
  } catch (error) {
    console.error('saveDiary 오류:', error);
    return { 
      success: false, 
      message: '일기 저장 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

/**
 * 선생님께 일기 전송
 * @param {Object} diaryData - 일기 데이터
 * @returns {Object} 결과 객체
 */
function sendToTeacher(diaryData) {
  try {
    // 먼저 저장
    const saveResult = saveDiary(diaryData);
    if (!saveResult.success) {
      return saveResult;
    }
    
    // 상태를 '전송완료'로 업데이트
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('일기데이터');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 방금 저장된 일기 찾기 (마지막 행에서 역순으로 검색)
    for (let i = values.length - 1; i >= 1; i--) {
      const row = values[i];
      if (row[1] === diaryData.name && 
          normalizeClass(row[2]) === normalizeClass(diaryData.studentClass) &&
          row[3] === diaryData.date) {
        // 상태 업데이트
        sheet.getRange(i + 1, 8).setValue('전송완료');
        break;
      }
    }
    
    return { 
      success: true, 
      message: '선생님께 일기가 전송되었습니다! ✨' 
    };
    
  } catch (error) {
    console.error('sendToTeacher 오류:', error);
    return { 
      success: false, 
      message: '일기 전송 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

/**
 * 일별 통계 업데이트
 */
function updateDailyStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dataSheet = ss.getSheetByName('일기데이터');
    const statsSheet = ss.getSheetByName('일별통계') || ss.insertSheet('일별통계');
    
    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    
    // 헤더 설정 (최초 1회)
    if (statsSheet.getLastRow() === 0) {
      statsSheet.getRange(1, 1, 1, 7).setValues([
        ['날짜', '전체참여', '맑음', '구름조금', '흐림', '비', '번개']
      ]);
    }
    
    // 오늘의 일기 데이터 집계
    const dataValues = dataSheet.getDataRange().getValues();
    const todayStats = {
      total: 0,
      맑음: 0,
      구름조금: 0,
      흐림: 0,
      비: 0,
      번개: 0
    };
    
    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      if (row[3] === today) { // 날짜 컬럼 확인
        todayStats.total++;
        const emotion = row[4]; // 감정날씨 컬럼
        if (todayStats.hasOwnProperty(emotion)) {
          todayStats[emotion]++;
        }
      }
    }
    
    // 기존 오늘 데이터 확인 및 업데이트
    const statsValues = statsSheet.getDataRange().getValues();
    let todayRowIndex = -1;
    
    for (let i = 1; i < statsValues.length; i++) {
      if (statsValues[i][0] === today) {
        todayRowIndex = i + 1;
        break;
      }
    }
    
    const newRow = [
      today,
      todayStats.total,
      todayStats.맑음,
      todayStats.구름조금,
      todayStats.흐림,
      todayStats.비,
      todayStats.번개
    ];
    
    if (todayRowIndex > 0) {
      // 기존 데이터 업데이트
      statsSheet.getRange(todayRowIndex, 1, 1, 7).setValues([newRow]);
    } else {
      // 새 데이터 추가
      statsSheet.appendRow(newRow);
    }
    
  } catch (error) {
    console.error('updateDailyStats 오류:', error);
  }
}

/**
 * 학생별 통계 업데이트
 */
function updateStudentStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dataSheet = ss.getSheetByName('일기데이터');
    const statsSheet = ss.getSheetByName('학생통계') || ss.insertSheet('학생통계');
    
    // 헤더 설정 (최초 1회)
    if (statsSheet.getLastRow() === 0) {
      statsSheet.getRange(1, 1, 1, 6).setValues([
        ['학반', '이름', '총작성수', '연속작성일', '마지막작성', '주요감정']
      ]);
    }
    
    // 학생별 통계 계산
    const dataValues = dataSheet.getDataRange().getValues();
    const studentStats = {};
    
    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      const name = row[1];
      const studentClass = normalizeClass(row[2]);
      const key = `${studentClass}_${name}`;
      
      if (!studentStats[key]) {
        studentStats[key] = {
          class: studentClass,
          name: name,
          count: 0,
          lastDate: '',
          emotions: {}
        };
      }
      
      studentStats[key].count++;
      studentStats[key].lastDate = row[3];
      
      const emotion = row[4];
      if (!studentStats[key].emotions[emotion]) {
        studentStats[key].emotions[emotion] = 0;
      }
      studentStats[key].emotions[emotion]++;
    }
    
    // 기존 데이터 지우고 새로 작성
    if (statsSheet.getLastRow() > 1) {
      statsSheet.getRange(2, 1, statsSheet.getLastRow() - 1, 6).clearContent();
    }
    
    // 새 데이터 추가
    Object.values(studentStats).forEach(stat => {
      const dominantEmotion = Object.keys(stat.emotions).reduce((a, b) => 
        stat.emotions[a] > stat.emotions[b] ? a : b
      );
      
      const newRow = [
        stat.class,
        stat.name,
        stat.count,
        0, // 연속작성일은 별도 계산 필요
        stat.lastDate,
        dominantEmotion
      ];
      
      statsSheet.appendRow(newRow);
    });
    
  } catch (error) {
    console.error('updateStudentStats 오류:', error);
  }
}

/**
 * 즉시 테스트할 수 있는 함수들
 */
function testGetMyDiariesWithRealData() {
  // 실제 스프레드시트에 있는 데이터로 테스트
  const result = getMyDiaries("한기", "3-1");
  console.log('테스트 결과:', result);
  return result;
}

/**
 * 스프레드시트의 모든 데이터 확인 (디버깅용)
 */
function debugAllSpreadsheetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('일기데이터');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('=== 전체 스프레드시트 데이터 ===');
    console.log('총 행 수:', values.length);
    
    for (let i = 0; i < values.length; i++) {
      console.log(`행 ${i}:`, values[i]);
    }
    
    return { success: true, data: values };
  } catch (error) {
    console.error('디버그 오류:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * 특정 학반의 모든 학생 일기 확인 (디버깅용)
 */
function debugClassData(className = "3-1") {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('일기데이터');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log(`=== ${className} 학반 데이터 ===`);
    
    const classData = [];
    for (let i = 1; i < values.length; i++) {
      if (normalizeClass(String(values[i][2]).trim()) === className) {
        classData.push({
          row: i,
          name: values[i][1],
          class: values[i][2],
          date: values[i][3],
          emotion: values[i][4],
          content: values[i][6]
        });
      }
    }
    
    console.log(`${className} 학반 일기 수:`, classData.length);
    classData.forEach(item => console.log(item));
    
    return { success: true, data: classData };
  } catch (error) {
    console.error('클래스 디버그 오류:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * 학반 정규화 테스트
 */
function testNormalizeClass() {
  const testCases = [
    "3-1",
    "3학년 1반", 
    "3학년1반",
    "3-1-15",
    "3 1",
    "4-2",
    "잘못된입력"
  ];
  
  console.log('=== 학반 정규화 테스트 ===');
  testCases.forEach(test => {
    console.log(`"${test}" → "${normalizeClass(test)}"`);
  });
}
