import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import './App.css';

function parseCommand(text) {
    let parsed = text.split('\n');
    let newList = "";
    parsed.map(line => {
    if (line.includes("Received message from entity")){
        newList+= line.match(/(?<=\bCommandString:\s)(.*)/g)
        }
    })
    return newList
}

function parseChat(text) {
    let parsed = text.split('\n');
    let newList = "";
    parsed.map(line => {
        if (line.includes("Received message from entity")){
            newList+= line.match(/(?<=\bplayer\s)(\w+)/g) + ":"+ line.split(":")[4]+"<br />";
        }
    })
    return newList
}

function App() {

  const [file, setFile] = useState();

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
          <Col>
            <h1>Northstar Logging Utility</h1>
          </Col>
          <Col>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Default file input example</Form.Label>
              <Form.Control type="file" onChange={e => getFile(e)} />
            </Form.Group>
          </Col>
          <Col>
            {parseChat(file)}            
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
