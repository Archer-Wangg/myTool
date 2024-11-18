import {
  useGetTeachingV1StudentsStudentIdVocabularyLevelSubmissions,
  // useGetTeachingV1StudentsStudentIdVocabularyLevelSubmissionsId,
  useGetTeachingV1StudentsStudentIdVocabularyLevelSubmissionsTake,
  usePutTeachingV1StudentsStudentIdVocabularyLevelSubmissionsId,
} from '@/api/hooks';
import { WordsSelectPageLayout } from '@/layouts/wordsSelect-page-layout';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Modal from './dialog';
import toast from 'react-hot-toast';
// import { Data } from './data';
import _ from 'lodash';

const Item = (props: { answer: string | undefined; idx: number; onSelect: (id: number) => void }) => {
  const [color, setColor] = useState('bg-[#DEDEDE]');
  const handleClick = () => {
    setColor('bg-[#71A232]');
    props.onSelect(props.idx);
    setTimeout(() => {
      setColor('bg-[#DEDEDE]');
    }, 500);
  };
  return (
    <div className="py-[26px] flex items-center justify-between w-[554px] border-b-2" onClick={handleClick}>
      <span className="text-[24px] font-medium">{props.answer}</span>
      <div className="px-[30px] py-[19px]">
        <div className={`w-[16px] h-[16px] rounded-[50px] ${color}`}></div>
      </div>
    </div>
  );
};

const CountdownTimer = (props: { seconds: number; color: string }) => {
  const circumference = 2 * Math.PI * 69; // 内环的周长
  const radius = 69;
  const centerX = radius + 10; // 10 是外环的 strokeWidth
  const progress = (10 - props.seconds) / 10; // 计算当前倒计时进度
  const dashOffset = circumference * progress; // 计算内环路径的偏移量
  const svgStyle = {
    width: '154px',
    height: '152px',
  };

  const circleStyle = {
    fill: 'transparent',
    stroke: props.color,
    strokeWidth: '10',
    strokeDasharray: circumference,
    strokeDashoffset: -dashOffset,
    transform: 'rotate(-90deg)', // 顺时针旋转90度
    transformOrigin: 'center', // 以中心点为旋转中心
  };

  const textStyle = {
    fill: props.color,
    stroke: props.color,
    fontSize: '44px',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  };

  return (
    <div>
      <div className="flex justify-center">
        <svg style={svgStyle}>
          <circle cx={centerX} cy={centerX} r={radius} style={circleStyle} />
          <text x={centerX} y={centerX} style={textStyle}>
            {props.seconds >= 0 ? props.seconds : 0}s
          </text>
        </svg>
      </div>
    </div>
  );
};

export default function Testing() {
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0); //正在测试题组之题目的idx
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { data: questions, isLoading } = useGetTeachingV1StudentsStudentIdVocabularyLevelSubmissionsTake(Number(studentId));
  const [over, setOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [trueGroup, setTrueGroup] = useState([]); //全部回答正确的题目
  const [falseGroup, setFalseGroup] = useState([]); //全部回答错误的题目
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); //是否禁用按钮
  const [allSelectedAnswers, setAllSelectedAnswers] = useState([]); //所有已选择的答案
  const [allQuestions, setAllQuestions] = useState([]); //所有的题目
  const allLevels = [
    '小学初级水平',
    '小学中级水平',
    '小学高级水平',
    '初中初级水平',
    '初中中级水平',
    '初中高级水平',
    '高中初级水平',
    '高中中级水平',
    '高中高级水平',
    '大学初级水平',
    '大学中级水平',
    '大学高级水平',
  ]; //全部学段
  const vocabularyOfLevel = [200, 400, 700, 1100, 1500, 2000, 2500, 3000, 3500, 4200, 5500, 7000]; //学段相对的词汇量
  const passCorrectRate = [7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6]; //每个学段通过该有的每组正确数
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0); //当前正在测试的题组阶段的idx
  const [currentLevelLeftWords, setCurrentLevelLeftWords] = useState([]); //当前学段词库剩余的全部题目
  const [currentTestingWords, setCurrentTestingWords] = useState(_.sampleSize(currentLevelLeftWords, 10)); //当前正在测试的题组
  const [currentTestingCorrectAnswers, setCurrentTestingCorrectAnswers] = useState(0); //当前测试题组的正确数
  const [unpassP1Arrays, setUnpassP1Arrays] = useState(0);
  const [unpassP2Arrays, setUnpassP2Arrays] = useState(0);
  // 更新 allQuestions 时，动态过滤当前学段词库剩余的全部题目
  useEffect(() => {
    if (questions?.data?.quiz_data?.questions) {
      setAllQuestions(questions.data.quiz_data.questions);
    }
  }, [questions]);

  // 根据 currentLevelIdx 或 allQuestions 的变化，更新当前学段的剩余题目和测试题组
  useEffect(() => {
    const filteredWords = allQuestions?.filter((question) => question.level === allLevels[currentLevelIdx]);
    setCurrentLevelLeftWords(filteredWords);
    if (filteredWords.length > 0) {
      setCurrentTestingWords(_.sampleSize(filteredWords, 10));
    };
  }, [allQuestions, currentLevelIdx]);

  const getNextTestWords = () => {
    const P1LeftWord = allQuestions?.filter((question: { level: string }) => question.level === '小学初级水平'); //小学初级水平阶段剩余的题目总数
    //如果已选答案超过120 或 小学初级水平阶段题目只剩当前这一组（或已经没有了）且当前这一组的正确率不足时，提交全部答案，测试结束
    if (
      allSelectedAnswers.length >= 120 ||
      (P1LeftWord.length <= 10 && currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx])
    ) {
      submit();
      setIsRunning(false);
      setOver(true);
      return;
    }
    //将测试过的题目从总题库中去除，并更新其状态
    const newAllQuestions = allQuestions?.filter((question: unknown) => !currentTestingWords.includes(question));
    setAllQuestions(newAllQuestions);
    //如当前题组正确数满6，更新进入下一阶段，并更新题组
    if (currentTestingCorrectAnswers >= passCorrectRate[currentLevelIdx]) {
      setCurrentLevelIdx(currentLevelIdx + 1);
      const newTestingWords = _.sampleSize(
        newAllQuestions.filter((question: { level: string }) => question.level === allLevels[currentLevelIdx + 1]),
        10,
      );
      setCurrentTestingWords(newTestingWords);
    }
    //如当前题组正确数不满6，且当前学段超过小学初级水平，退回至前一学段，并更新题组
    if (currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx] && currentLevelIdx > 0) {
      setCurrentLevelIdx(currentLevelIdx - 1);
      const newTestingWords = _.sampleSize(
        newAllQuestions.filter((question: { level: string }) => question.level === allLevels[currentLevelIdx - 1]),
        10,
      );
      setCurrentTestingWords(newTestingWords);
    }
    //如当前题组正确数不满6，且当前已是最低学段，保持当前学段，并更新题组
    if (currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx] && currentLevelIdx === 0) {
      setUnpassP1Arrays(unpassP1Arrays + 1)
      setCurrentLevelIdx(currentLevelIdx);
      const newTestingWords = _.sampleSize(
        newAllQuestions.filter((question: { level: string }) => question.level === allLevels[0]),
        10,
      );
      setCurrentTestingWords(newTestingWords);
    }
    if (currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx] && currentLevelIdx === 1) {
      setUnpassP2Arrays(unpassP2Arrays + 1)
    }
    //题组更新完毕，重置题组正确数 及 当前题组之当前题目的idx
    setCurrentTestingCorrectAnswers(0);
    setCurrentIndex(0);
  };

  const { data: reportList } = useGetTeachingV1StudentsStudentIdVocabularyLevelSubmissions(Number(studentId));
  const finishedList = reportList?.data?.filter((item: any) => item.finished_at !== '');

  useEffect(() => {
    let timer: any;
    if (isRunning === true) {
      timer = setInterval(() => {
        setTimerSeconds((prevSeconds) => prevSeconds - 1);
        if (timerSeconds === 0) {
          const question = currentTestingWords[currentIndex];
          const newItem = {
            question_id: question?.id,
            answer_id: '',
          };
          const selectedAnswer = {
            question_id: question?.id,
            level: question?.level,
            correct: false,
          };
          setFalseGroup([...falseGroup, newItem]);
          setAllSelectedAnswers([...allSelectedAnswers, selectedAnswer]); //将超时未选择的答案按照选择错误的情况，放入所有已选择的答案数组中
          clearInterval(timer);
          setTimerSeconds(10);
          //如已做的题目数 + 本题（+1）是10的整数倍 且 总答题数不超过120的时候，获取下一组，不然则执行else
          if (
            (allSelectedAnswers.length + 1) % 10 === 0 &&
            allSelectedAnswers.length !== 0 &&
            allSelectedAnswers.length < 120
          ) {
            getNextTestWords();
          } else {
            //如非上述情况，则获取下一题，如果已经完成120题 或 当前学段只剩下当前题组的10题 且 当前题组已做至最后一个 且 正确数小于6，即提交全部答案，结束测试
            if (
              allSelectedAnswers.length === 120 ||
              (currentLevelLeftWords.length === 10 &&
                currentIndex > 9 &&
                currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx])
            ) {
              submit();
              setIsRunning(false);
              setOver(true);
            }
            setCurrentIndex(currentIndex + 1);
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentIndex, timerSeconds, isRunning]);

  const handleRedirect = () => {
    navigate(`/vocab-test/${studentId}/${finishedList?.[0].id}`);
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleSelectUnknow = () => {
    // setFinished(true);
    setIsButtonDisabled(true);
    const question = currentTestingWords[currentIndex];
    const newItem = {
      question_id: question?.id,
      answer_id: '',
    };
    const selectedAnswer = {
      question_id: question?.id,
      level: question?.level,
      correct: false,
    };
    setFalseGroup([...falseGroup, newItem]);
    setAllSelectedAnswers([...allSelectedAnswers, selectedAnswer]); //将不会的答案按照选择错误的情况，放入所有已选择的答案数组中
    //情况相同，见上面useEffect中的注解
    setTimeout(() => {
      if (isRunning) {
        if (
          (allSelectedAnswers.length + 1) % 10 === 0 &&
          allSelectedAnswers.length !== 0 &&
          allSelectedAnswers.length < 120
        ) {
          getNextTestWords();
        } else {
          if (
            allSelectedAnswers.length === 120 ||
            (currentLevelLeftWords.length === 10 &&
              currentIndex > 9 &&
              currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx])
          ) {
            submit();
            setIsRunning(false);
            setOver(true);
          }
          setCurrentIndex(currentIndex + 1);
        }
        setTimerSeconds(10);
      }
      setIsButtonDisabled(false);
    }, 500);
  };

  const handleselect = (idx: number) => {
    if (!isRunning) {
      toast('请点击开始检测按钮，以开始检测', { icon: 'ℹ️' });
      return;
    }
    setIsButtonDisabled(true);
    const question = currentTestingWords[currentIndex];
    const answer = currentOptions[idx];
    const newItem = {
      question_id: question?.id,
      answer_id: answer?.id,
    };

    if (answer?.correct === true) {
      setTrueGroup([...trueGroup, newItem]);
      const selectedAnswer = {
        question_id: question?.id,
        level: question?.level,
        correct: true,
      };
      setAllSelectedAnswers([...allSelectedAnswers, selectedAnswer]); //将选择正确的答案按照选择正确的情形，放入所有已选择的答案数组中
      setCurrentTestingCorrectAnswers(currentTestingCorrectAnswers + 1); //本题组答案正确数 + 1
    } else {
      setFalseGroup([...falseGroup, newItem]);
      const selectedAnswer = {
        question_id: question?.id,
        level: question?.level,
        correct: false,
      };
      setAllSelectedAnswers([...allSelectedAnswers, selectedAnswer]); //将选择错误的答案按照选择错误的情形，放入所有已选择的答案数组中
    }
    //情况相同，见上面useEffect中的注解
    setTimeout(() => {
      if (isRunning) {
        if (
          (allSelectedAnswers.length + 1) % 10 === 0 &&
          allSelectedAnswers.length !== 0 &&
          allSelectedAnswers.length < 120
        ) {
          getNextTestWords();
        } else {
          if (
            allSelectedAnswers.length === 120 ||
            (currentLevelLeftWords.length === 10 &&
              currentIndex > 9 &&
              currentTestingCorrectAnswers < passCorrectRate[currentLevelIdx])
          ) {
            submit();
            setIsRunning(false);
            setOver(true);
          }
          setCurrentIndex(currentIndex + 1);
        }
        setTimerSeconds(10);
      }
      setIsButtonDisabled(false);
    }, 500);
  };

  const { mutate: submitQuiz } = usePutTeachingV1StudentsStudentIdVocabularyLevelSubmissionsId();

  //按照不同的学段 分类作答的答案
  const groupedByLevel = allSelectedAnswers.reduce((result, item) => {
    // 检查是否已有当前 level 的数组
    if (!result[item.level]) {
      result[item.level] = []; // 初始化一个新的数组
    }
    result[item.level].push(item); // 将 item 添加到对应 level 的数组中
    return result;
  }, {});

  //将每一组的正确率 按照既定的顺序 排成一个数组
  const levelAccuracyArray = allLevels.map((level) => {
    const items = groupedByLevel[level] || []; // 如果没有该级别的数据，默认为空数组
    const correctCount = items.filter((item: { correct: any }) => item.correct).length;
    return items.length > 0 ? correctCount / items.length : 0; // 避免除以零
  });

  //创建一个变量 以存储正确率超过0.6 之最高学段 的idx
  let highestIndex = -1;
  //从高学段开始遍历，找到第一个正确率超过0.6的学段，即为词汇量基数学段
  for (let i = levelAccuracyArray.length - 1; i >= 0; i--) {
    if (levelAccuracyArray[i] > passCorrectRate[i] / 10) {
      highestIndex = i;
      break;
    }
  }
  //当没有一个学段正确率超过0.6，即基数学段为 小学初级水平
  if (highestIndex === -1) {
    highestIndex = 0;
  }
  //设置浮动值，以（实际正确率 + 1 的值 除以 2） 为标准，浮动基数为 基数学段词汇量 与其相临学段词汇量的差额的一半， 0.6-0.8向下浮动，0.8-1.0向上浮动
  const floatingValue =
    ((levelAccuracyArray[highestIndex] - (1 + passCorrectRate[highestIndex] / 10) / 2) /
      ((1 - passCorrectRate[highestIndex] / 10) / 2)) *
    (vocabularyOfLevel[highestIndex] - Number(vocabularyOfLevel[highestIndex - 1])) *
    0.5;

  //创建一个变量，以存储最终词汇量结果
  let finalVocabulary;
  //如浮动值为NaN，（NaN存在的原因：vocabularyOfLevel[highestIndex - 1]，已经是最低学段了，不存在highestIndex - 1的情况）
  //即最低学段的正确率未过0.6，无法进行浮动处理按以下逻辑得到最终的词汇量检测结果。
  if (Number.isNaN(floatingValue)) {
    finalVocabulary = Math.floor(Math.random() * (120 - 80 + 1)) + 80; //最低学段正确率低于0.6, 随机在80-120中取一个值
  } else {
    //基数学段词汇量 + 浮动值 = 最终词汇量
    finalVocabulary = (vocabularyOfLevel[highestIndex] + floatingValue);
  }


  const submit = () => {
    const allAnswers = [...trueGroup, ...falseGroup];
    const formattedData = {};
    
    allAnswers.forEach((item) => {
      formattedData[item.question_id] = { answer_ids: [item.answer_id] };
    });
    console.log(formattedData);
    
    submitQuiz({
      studentId: Number(studentId),
      id: Number(questions?.data?.id),
      data: {
        submission_data: formattedData,
        score: String(finalVocabulary),
      },
    });
  };
  //打乱答案顺序
  const [currentOptions, setCurrentOptions] = useState(_.shuffle(currentTestingWords?.[currentIndex]?.answers));
  useEffect(() => {
    const NewCurrentOptions = _.shuffle(currentTestingWords?.[currentIndex]?.answers);
    setCurrentOptions(NewCurrentOptions);
  }, [currentIndex, currentTestingWords]);

  let color;
  if (timerSeconds > 2) {
    color = '#669629';
  }
  if (timerSeconds <= 2) {
    color = '#FB8843';
  }

  useEffect(() => {
    if (allSelectedAnswers.length >= 120 || unpassP1Arrays === 3 || unpassP2Arrays === 3) {
      submit();
      setIsRunning(false);
      setOver(true);
    }
  }, [allSelectedAnswers,unpassP1Arrays, unpassP2Arrays]);
  
  return (
    <WordsSelectPageLayout
      title="词汇量检测中"
      H2="测试约5~8分钟"
      onBack={() => {
        navigate(-1);
      }}
    >
      <div>
        <Modal
          isOpen={over}
          title="测试完成!"
          onOk={() => navigate(`/vocab-test/${studentId}/${questions?.data?.id}`)}
          okText="查看结果"
        ></Modal>
      </div>
      <div className="flex flex-col items-center">
        {isLoading 
          ? <div className='bg-white pt-[40px] px-[30px] pb-[30px] w-[614px] h-[700px] rounded-[40px] flex justify-center flex-col items-center text-[44px]'>题目加载中。。。。。</div> 
          : <div className="bg-white pt-[40px] px-[30px] pb-[30px] w-[614px] rounded-[40px] flex justify-center flex-col">
          <CountdownTimer seconds={timerSeconds} color={color} />
          <div className="flex justify-center text-[44px] font-medium mt-[30px]">
            {currentTestingWords?.[currentIndex]?.question_name}
          </div>
          <div className="flex flex-col">
            {currentOptions.map((answers: any, idx: number) => {
              const answer = currentTestingWords?.[currentIndex]?.answers;
              return (
                <div key={answers.id}>
                  <Item
                    idx={idx}
                    answer={answers.text}
                    onSelect={(idx: number) => {
                      isButtonDisabled ? undefined : handleselect(idx);
                    }}
                  />
                  {idx !== answer?.length - 1 && <div className="bg-[#DEDEDE] w-full h-[1px]"></div>}
                </div>
              );
            })}
          </div>
        </div>}
        {isRunning === false && (
          <div className="flex mt-[65px] gap-[30px]">
            {finishedList?.length > 0 && (
              <div className="bg-white px-[60px] py-[25px] rounded-[50px]">
                <button className="text-[28px]" onClick={handleRedirect}>
                  上次成绩
                </button>
              </div>
            )}
            <div className="bg-[#FB8843] px-[60px] py-[25px] rounded-[50px]">
              <button className="text-white text-[28px]" onClick={handleStart}>
                开始检测
              </button>
            </div>
          </div>
        )}
        {isRunning === true && (
          <div className="px-[60px] py-[25px] rounded-[100px] bg-[#FB8843] mt-[65px]">
            <button className="text-white text-[28px]" onClick={isButtonDisabled ? undefined : handleSelectUnknow}>
              不认识
            </button>
          </div>
        )}
      </div>
    </WordsSelectPageLayout>
  );
}
