import React from 'react'

const WeekByWeek = () => (
  <div className="Section">
    <div className="container">
      <div className="columns">
        <div className="Section-img-container col-2 col-sm-12">
          <img alt='' className="img-responsive" src="syntax.png" />
        </div>
        <div className="col-10 col-sm-12">
          <h4>Evolving Syntax</h4>
          <h6>Starts with Lambda, Ends With Loops</h6>
          <p>
            Students start with a small, purely functional language.
            More features such as list data structure are introduced gradually.
            Eventually, imperative programming constructs such as objects and loops are added.
            We added a sanitizer phase to make sure students only used allowed language features.
          </p>
        </div>
      </div>
      <ul className="Section-weeks step">
        <li className="step-item">
          <a>
            <span className="Section-week">Week 1</span>
            <br/>
            Functions
          </a>
        </li>
        <li className="step-item">
          <a>
            <span className="Section-week">Week 5</span>
            <br/>
            List
          </a>
        </li>
        <li className="step-item">
          <a>
            <span className="Section-week">Week 6</span>
            <br/>
            Mutations
          </a>
        </li>
        <li className="step-item">
          <a>
            <span className="Section-week">Week 8</span>
            <br/>
            Objects
          </a>
        </li>
        <li className="step-item">
          <a>
            <span className="Section-week">Week 12</span>
            <br/>
            Loops
          </a>
        </li>
      </ul>
    </div>
  </div> 
)

export default WeekByWeek
