import { useMemo, useState } from 'react';
import { Container, Row, Col, Form, Button} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const modifyArray = (array, num) => {
  let index = array.indexOf(num);
  if (index > -1) { // only splice array when item is found
    array.splice(index, 1); // 2nd parameter means remove one item only
  }
  return array;
}

const parseFile = (text, filters) => {
    let parsed = text.split('\n');
    let newList = [];
    parsed.map(line => {
      if (filters.includes("chat") && line.includes("Received message from entity")){
        newList.push( line.match(/(?<=\bplayer\s)(\w+)/g) + ":"+ line.split(":")[4]);
      }
      if (!filters.includes("chat") && filters.includes("chat-command") && line.includes("Received message from entity") && line.includes(": !") ) {
        newList.push( line.match(/(?<=\bplayer\s)(\w+)/g) + ":"+ line.split(":")[4]);
      }
      if (filters.includes("command") && line.includes("CommandString")){
        newList.push(line.match(/(?<=\bCommandString:\s)(.*)/g))
      }
      if (filters.includes("spew") && line.includes("[SERVER SPEW_MESSAGE]")) {
        newList.push(line.split("[SERVER SPEW_MESSAGE] ")[1])
      }
      if (filters.includes("script") && line.includes("[SERVER SCRIPT]")) {
        newList.push(line.split("[SERVER SCRIPT] ")[1])
      }
      if (filters.includes("warning") && line.includes("[SERVER SPEW_WARNING]")) {
        newList.push(line.split("[SERVER SPEW_WARNING] ")[1])
      }
      if (filters.includes("connections") && (line.includes(" # ") || line.includes("[::"))){
        newList.push(line.match(/#\s\d(.*)/g) || line.match(/\[info\](.*)/g))
      }
    })
    return newList
  }

function App() {

  const [file, setFile] = useState();
  const [filter, setFilter] = useState([]);
  const [updated, setUpdated] = useState("");

  const updateFilter = (keyword, addOrRemove) => {
    let newFilter = filter;
    if (addOrRemove) {
      newFilter.push(keyword)
    }
    else {
      newFilter = modifyArray(newFilter, keyword)
    }

    setFilter(newFilter);
    setUpdated(Math.random().toString(36).substring(2,7))
  }

  const fileText = useMemo(() => file && parseFile(file, filter), [updated, file, filter]);

  const reader = new FileReader();

  const getFile = (e) => {

    reader.onload = (function(theFile) {
      return function(e) {
          setFile(e.target.result);
      };
      })(e.target.files[0]);

    // Read in the image file as a data URL.
    reader.readAsText(e.target.files[0]);

  }

  return (
    <div className="App">
      <Container>
        <Row>
          <Col className='p-3'>
            <h1>Northstar Logging Utility</h1>
          </Col>
        </Row>
        <Row>
          <Col className='d-flex'>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Select your Northstar log</Form.Label>
              <Form.Control type="file" onChange={e => getFile(e)} />
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex justify-content-end">
            <Form.Check
              className="p-4"
              type="checkbox"
              id="chat-check"
              label="Chat"
              onClick={e => updateFilter("chat", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="command-check"
              label="Chat Command"
              onClick={e => updateFilter("chat-command", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="command-check"
              label="Command"
              onClick={e => updateFilter("command", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="spew-check"
              label="Spew Message"
              onClick={e => updateFilter("spew", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="script-check"
              label="Script Message"
              onClick={e => updateFilter("script", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="warning-check"
              label="Warning Message"
              onClick={e => updateFilter("warning", e.target.checked)}
            />
            <Form.Check
              className="p-4"
              type="checkbox"
              id="connection-check"
              label="Connections"
              onClick={e => updateFilter("connections", e.target.checked)}
            />
          </Col>
          <Col md={6}>
            {fileText && filter.length > 0 && 
              <Button variant="primary" href={`data:text/plain;charset=utf-8,${encodeURIComponent(fileText)}`} download>Download</Button>
            }
          </Col>
          <Row>
            <Col className={fileText ? 'text-container' : ''}>
              {fileText && (fileText).map((line, index) => 
                <p key={index}>{line}</p>  
              )}            
            </Col>
          </Row>
        </Row>
      </Container>
    </div>
  );
}

export default App;
