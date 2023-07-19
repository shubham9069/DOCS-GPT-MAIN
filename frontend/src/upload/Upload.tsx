import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { ActiveState } from '../models/misc';
import { getDocs } from '../preferences/preferenceApi';
import { setSourceDocs } from '../preferences/preferenceSlice';

export default function Upload({
  modalState,
  setModalState,
}: {
  modalState: ActiveState;
  setModalState: (state: ActiveState) => void;
}) {
  const [docName, setDocName] = useState('');
  const [tab, setTab] = useState(1);
  const [quesArr,setQuesArr] = useState<any>([])
  const [questionInput,setQuestionInput] = useState("")
  const [files, setfiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{
    type: 'UPLOAD' | 'TRAINIING';
    percentage: number;
    taskId?: string;
    failed?: boolean;
  }>();

  
  function Progress({
    title,
    isCancellable = false,
    isFailed = false,
  }: {
    title: string;
    isCancellable?: boolean;
    isFailed?: boolean;
  })
   {
    return (
      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-xl tracking-[0.15px]">{title}...</p>
        <p className="text-sm text-gray-2000">This may take several minutes</p>
        <p className={`ml-5 text-xl text-red-400 ${isFailed ? '' : 'hidden'}`}>
          Over the token limit, please consider uploading smaller document
        </p>
        <p className="mt-10 text-2xl">{progress?.percentage || 0}%</p>

        <div className="mb-10 w-[50%]">
          <div className="h-1 w-[100%] bg-blue-4000"></div>
          <div
            className={`relative bottom-1 h-1 bg-blue-5000 transition-all`}
            style={{ width: `${progress?.percentage || 0}%` }}
          ></div>
        </div>

        <button
          onClick={() => {
            setDocName('');
            setfiles([]);
            setProgress(undefined);
            setModalState('INACTIVE');
          }}
          className={`rounded-md bg-blue-3000 px-4 py-2 text-sm font-medium text-white ${
            isCancellable ? '' : 'hidden'
          }`}
        >
          Finish
        </button>
      </div>
    );
  }

  function UploadProgress() {
    return <Progress title="Upload is in progress"></Progress>;
  }

  function TrainingProgress() {
    const dispatch = useDispatch();
    useEffect(() => {
      (progress?.percentage ?? 0) < 100 &&
        setTimeout(() => {
          const apiHost = import.meta.env.VITE_API_HOST;
          fetch(`${apiHost}/api/task_status?task_id=${progress?.taskId}`)
            .then((data) => data.json())
            .then((data) => {
              if (data.status == 'SUCCESS') {
                if (data.result.limited === true) {
                  getDocs().then((data) => dispatch(setSourceDocs(data)));
                  setProgress(
                    (progress) =>
                      progress && {
                        ...progress,
                        percentage: 100,
                        failed: true,
                      },
                  );
                } else {
                  getDocs().then((data) => dispatch(setSourceDocs(data)));
                  setProgress(
                    (progress) =>
                      progress && {
                        ...progress,
                        percentage: 100,
                        failed: false,
                      },
                  );
                }
              } else if (data.status == 'PROGRESS') {
                setProgress(
                  (progress) =>
                    progress && {
                      ...progress,
                      percentage: data.result.current,
                    },
                );
              }
            });
        }, 5000);
    }, [progress, dispatch]);
    return (
      <Progress
        title="Training is in progress"
        isCancellable={progress?.percentage === 100}
        isFailed={progress?.failed === true}
      ></Progress>
    );
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setfiles(acceptedFiles);
    setDocName(acceptedFiles[0]?.name);
  }, []);

  const doNothing = () => undefined;

  const uploadFile = () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });
    formData.append('name', docName);
    formData.append('user', 'local');
    const apiHost = import.meta.env.VITE_API_HOST;
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (event) => {
      const progress = +((event.loaded / event.total) * 100).toFixed(2);
      setProgress({ type: 'UPLOAD', percentage: progress });
    });
    xhr.onload = () => {
      const { task_id } = JSON.parse(xhr.responseText);
      setProgress({ type: 'TRAINIING', percentage: 0, taskId: task_id });
    };
    xhr.open('POST', `${apiHost + '/api/upload'}`);
    xhr.send(formData);
  };
  const QuestionFun=()=>{
    if(questionInput){
      setQuesArr([...quesArr,{id:quesArr.length,text:questionInput}])
      setQuestionInput("")
    }
   
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    onDragEnter: doNothing,
    onDragOver: doNothing,
    onDragLeave: doNothing,
    maxSize: 25000000,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/x-rst': ['.rst'],
      'text/x-markdown': ['.md'],
      'application/zip': ['.zip'],
    },
  });

  let view;
  if (progress?.type === 'UPLOAD') {
    view = <UploadProgress></UploadProgress>;
  } else if (progress?.type === 'TRAINIING') {
    view = <TrainingProgress></TrainingProgress>;
  } else {
    view = (

      <>
      <div className='flex gap-5 m-2'>
        <p className='' style={{background: tab==1 ? 'rgb(227 213 255 / 47%)': "white" , padding: '0.5rem 2rem ',borderRadius:30,color: tab== 1 ? "rgb(75 2 226)":"black",fontSize:14,fontWeight:600,cursor:'pointer'}} onClick={()=>setTab(1)}>Docs</p>
        <p style={{background: tab==2 ? 'rgb(227 213 255 / 47%)': "white" , padding: '0.5rem 2rem ',borderRadius:30,color: tab== 2 ? "rgb(75 2 226)":"black",fontSize:14,fontWeight:600,cursor:'pointer'}} onClick={()=>setTab(2)}>Question  </p>
      </div>
      {tab==1 ?
      <>
           <p className="text-xl text-jet">Upload New Documentation</p>
        <p className="mb-3 text-xs text-gray-4000">
          Please upload .pdf, .txt, .rst, .md, .zip limited to 25mb
        </p>
        <input
          type="text"
          className="h-10 w-[60%] rounded-md border-2 border-gray-5000 px-3 outline-none"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
        ></input>
        <div className="relative bottom-12 left-2 mt-[-18.39px]">
          <span className="bg-white px-2 text-xs text-gray-4000">Name</span>
        </div>
        <div {...getRootProps()}>
          <span className="rounded-md border border-blue-2000 px-4 py-2 font-medium text-blue-2000 hover:cursor-pointer">
            <input type="button" {...getInputProps()} />
            Choose Files
          </span>
        </div>
     
        <div className="mt-9">
          <p className="mb-5 font-medium text-eerie-black">Uploaded Files</p>
          {files.map((file) => (
            <p key={file.name} className="text-gray-6000">
              {file.name}
            </p>
          ))}
          {files.length === 0 && <p className="text-gray-6000">None</p>}
        </div>
        <div className="flex flex-row-reverse">
          <button
            onClick={uploadFile}
            className="ml-6 rounded-md bg-blue-3000 py-2 px-6 text-white"
          >
            Train
          </button>
          <button
            onClick={() => {
              setDocName('');
              setfiles([]);
              setModalState('INACTIVE');
              
            }}
            className="font-medium"
          >
            Cancel
          </button>
        </div>
      </>:
      <>
     <div>
      <div className='question' style={{height:250 ,overflowY:'auto',padding:"0 10px"}}>
        { quesArr.length ? quesArr?.map((q)=>{

          return  <div key={ q?.id} className='flex' style={{ margin:'1rem 0', justifyContent:'space-between',gridGap:'5px'}} >
            <span style={{padding:'8px 12px',borderRadius: 6,background:'#d9dbe459',wordBreak: 'break-word',  flex: 1, color:'rgb(126, 130, 153)',fontSize:14}}>{q.text}</span>
            
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={()=>setQuesArr(quesArr.filter((ques:any)=>ques?.id!=q?.id))}>
<g id="arr/arr015">
<path id="Vector" opacity="0.3" d="M12 10.6L14.8 7.8C15.2 7.4 15.8 7.4 16.2 7.8C16.6 8.2 16.6 8.80002 16.2 9.20002L13.4 12L12 10.6ZM10.6 12L7.8 14.8C7.4 15.2 7.4 15.8 7.8 16.2C8 16.4 8.3 16.5 8.5 16.5C8.7 16.5 8.99999 16.4 9.19999 16.2L12 13.4L10.6 12Z" fill="#F1416C"/>
<path id="Vector_2" d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12ZM13.4 12L16.2 9.20001C16.6 8.80001 16.6 8.19999 16.2 7.79999C15.8 7.39999 15.2 7.39999 14.8 7.79999L12 10.6L9.2 7.79999C8.8 7.39999 8.2 7.39999 7.8 7.79999C7.4 8.19999 7.4 8.80001 7.8 9.20001L10.6 12L7.8 14.8C7.4 15.2 7.4 15.8 7.8 16.2C8 16.4 8.3 16.5 8.5 16.5C8.7 16.5 9 16.4 9.2 16.2L12 13.4L14.8 16.2C15 16.4 15.3 16.5 15.5 16.5C15.7 16.5 16 16.4 16.2 16.2C16.6 15.8 16.6 15.2 16.2 14.8L13.4 12Z" fill="#F1416C"/>
</g>
</svg>

            </div>
        }):
        
        <div style={{
          display:'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width:'100%',
          height:'inherit'

        }}>
          <img src="question.png"></img>
          </div>}



      </div>

        <div className='flex gap-2 items-center'>
      <input type="text" placeholder='Write question ' value={questionInput} onKeyUp={(e)=>e.keyCode==13 && (QuestionFun())} onChange={(e)=>setQuestionInput(e.target.value)} style={{width:'100%',padding:' 0.5rem 1rem ', border:'1px solid grey ',borderRadius:8}}></input>
      
<svg width="40" height="40" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={QuestionFun}>
<g id="Plus Square / Light / Duotone">
<path id="Shape" opacity="0.25" fill-rule="evenodd" clip-rule="evenodd" d="M5.17912 1.8761C3.43999 2.10579 2.1053 3.44048 1.87562 5.17961C1.71771 6.37522 1.5835 7.87083 1.5835 9.50065C1.5835 11.1305 1.71771 12.6261 1.87562 13.8217C2.1053 15.5608 3.43999 16.8955 5.17912 17.1252C6.37473 17.2831 7.87034 17.4173 9.50016 17.4173C11.13 17.4173 12.6256 17.2831 13.8212 17.1252C15.5603 16.8955 16.895 15.5608 17.1247 13.8217C17.2826 12.6261 17.4168 11.1305 17.4168 9.50065C17.4168 7.87083 17.2826 6.37522 17.1247 5.17961C16.895 3.44048 15.5603 2.10579 13.8212 1.8761C12.6256 1.7182 11.13 1.58398 9.50016 1.58398C7.87034 1.58398 6.37473 1.7182 5.17912 1.8761Z" fill="#64bdef"/>
<path id="Shape_2" fill-rule="evenodd" clip-rule="evenodd" d="M9.49984 13.4577C9.93706 13.4577 10.2915 13.1032 10.2915 12.666V10.291H12.6665C13.1037 10.291 13.4582 9.93657 13.4582 9.49935C13.4582 9.06212 13.1037 8.70768 12.6665 8.70768H10.2915V6.33268C10.2915 5.89546 9.93706 5.54102 9.49984 5.54102C9.06261 5.54102 8.70817 5.89546 8.70817 6.33268V8.70768H6.33317C5.89595 8.70768 5.5415 9.06212 5.5415 9.49935C5.5415 9.93657 5.89594 10.291 6.33317 10.291H8.70817V12.666C8.70817 13.1032 9.06261 13.4577 9.49984 13.4577Z" fill="#00A3FF"/>
</g>
</svg>

      </div>

     </div>
     <div className="flex flex-row-reverse">
          <button
          
            className="ml-6 rounded-md bg-blue-3000 py-2 px-6 text-white"
          >
            Train
          </button>
          <button
            onClick={() => {
              setModalState('INACTIVE');
              setQuesArr([])
            }}
            className="font-medium"
          >
            Cancel
          </button>
        </div>
      </>}
   
      </>
    );
  }

  return (
  
      <article className="mx-auto  flex max-w-lg  flex-col gap-4 rounded-lg bg-white p-6 " style={{width:400}}>
        {view}
     
    </article>
  );
}
// TODO: sanitize all inputs
