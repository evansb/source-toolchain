import PropTypes from 'prop-types'

const Section = ({ title, subtitle, children }) =>
  <div className="Section">
    <style jsx>{`
      .Section {
        margin-top: 50px;
        margin-bottom: 50px;
        padding: 0px 25px;
      }
      .Section-control {
        text-align: center;
      }
      .Section-control button {
        margin-left: 5px;
        margin-right: 5px;
      }
      .Section-error div {
        padding: 5px;
        font-family: 'Menlo', 'Consolas', monospace;
      }
      .Section-error-line {
        font-weight: 700;
        color: #FF5B92;
      }
      .Section-img-container {
        display: table-cell;
        padding: 0 15px;
        margin-bottom: 20px;
        vertical-align: middle;
        text-align: center;
        max-width: 300px;
      }
    `}</style>
    <div className="container">
      <div className="columns">
        <div className="col-12">
          <h4>{title}</h4>
          <h6>{subtitle}</h6>
          {children}
        </div>
      </div>
    </div>
  </div>

Section.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  child: PropTypes.element
}

export default Section
