import React from 'react'

const FriendlyErrorMessages = () => (
  <div className="Section">
    <div className="container">
      <div className="columns">
        <div className="Section-img-container col-2 col-sm-12">
          <img alt='' className="img-responsive" src="friendly.png" />
        </div>
        <div className="col-10 col-sm-12">
          <h4>Friendly Syntax Analyzer</h4>
          <h6>Explain common mistakes with clear error messages</h6>
          <p>
            Error messages should be educating, not fighting back.
            We make sure every errors, be it at the syntax or semantic
            level to have a human friendly explanation and suggestion for
            fixing them.
          </p>
        </div>
      </div>
      <div className="columns">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Code</td>
              <td>Message</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div> 
)

export default FriendlyErrorMessages
