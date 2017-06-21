import React from 'react';
import ReactDOM from 'react-dom';
import Interpreter from './Interpreter';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

ReactDOM.render(<Interpreter />, document.getElementById('interpreter-root'));
registerServiceWorker();
