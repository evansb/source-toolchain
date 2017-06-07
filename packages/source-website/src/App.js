import React, { Component } from 'react';
import './App.css';
import WeekByWeek from './WeekByWeek'
import SingleStepInterpreter from './SingleStepInterpreter'
import FriendlyErrorMessages from './FriendlyErrorMessages'
import Footer from './Footer'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <div className="container">
            <div className="App-logo">
              <img alt="Logo" src="logo.png" className="img-fit" />
            </div>
            <h2>source<span className="App-subtitle">toolchain</span></h2>
            <h6 className="App-subheading">A Subset of ES5 Optimised for Education</h6>
            <button className="btn btn-primary btn-lg">View on GitHub</button>
          </div>
        </div>
        <div className="App-main">
          <WeekByWeek />
          <SingleStepInterpreter />
          <FriendlyErrorMessages />
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
