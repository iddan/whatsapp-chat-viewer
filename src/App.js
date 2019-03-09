import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from "jszip";
import { makeArrayOfMessages, parseMessages } from "whatsapp-chat-parser/src/parser";
import './App.css';

const FileViewer = ({ files, fileName }) => {
  const [fileContents, setFileContents] = useState();
  const file = files[fileName];
  useEffect(() => {
    file.async("base64").then(fileContents => {
      setFileContents(fileContents)
    })
  });
  if (!file) {
    return <div>File: {fileName} (missing in the archive)</div>
  }
  if (fileContents) {
    if (fileName.endsWith('.jpg')) {
      return <img src={`data:image/jpg;base64, ${fileContents}`} />;
    }
    else if (fileName.endsWith('.png')) {
      return <img src={`data:image/png;base64, ${fileContents}`} />;
    }
    else if (fileName.endsWith('.opus')) {
      return <audio controls src={`data:audio/ogg;base64, ${fileContents}`} />
    }
    else if (fileName.endsWith('.mp4')) {
      return <video controls>
        <source type="video/mp4" src={`data:video/mp4;base64, ${fileContents}`}></source>
      </video>;
    }
    return <div>Can't view file {fileName}</div>
  }
  return <div>Loading file: {fileName}</div>
}

const Message = ({ message, author, date, files }) => {
  let fileName;
  const result = message.match('<attached: (.+)>');
  if (result) {
    [,fileName] = result;
  }
  return <div className="Message">
    <b>{date.toLocaleString()} {author}:</b>
    <div>{fileName ? <FileViewer fileName={fileName} files={files} /> : message}</div>
  </div>
}

const Chat = ({ messages, files }) => (
  <article>
    <button onClick={() => window.print()}>Print</button>
  {
    messages.map((message, i) => <Message key={i} {...message} files={files} />)
  }
  </article>
)

const App = () => {
    const [files, setFiles] = useState({});
    const [messages, setMessages] = useState([]);
    const onDrop = useCallback(acceptedFiles => {
      const [zipFile] = acceptedFiles;
      const fileReader = new FileReader();
      const zip = new JSZip();
      fileReader.readAsArrayBuffer(zipFile);
      fileReader.addEventListener("load", async (event) => {
        const arrayBuffer = event.target.result;
        let files;
        try {
          ({ files } = await zip.loadAsync(arrayBuffer));
          setFiles(files);
        }
        catch (error) {
          alert("Given file is not a ZIP file");
          return;
        }
        const chatFile = files['_chat.txt'];
        const chatText = await chatFile.async("string");
        const messages = parseMessages(makeArrayOfMessages(chatText.split('\n')));
        setMessages(messages);
      });
    }, []);
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
    
    return (
      <div>
        <h1>WhatsApp Converter</h1>
        <h2>Convert your WhatsApp exported chats to a viewable format</h2>
        <p>The chat content is not sent over the internet. So it's safe.</p>
        <div {...getRootProps()} className="drop-zone">
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop some files here, or click to select files</p>
          }
        </div>
        {messages.length > 0 && <Chat messages={messages} files={files} />}
      </div>
    );
}

export default App;
