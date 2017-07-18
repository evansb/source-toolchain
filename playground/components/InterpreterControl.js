export default ({
  isNextDisabled,
  isPreviousDisabled,
  isStartOverDisabled,
  isUntilEndDisabled,
  isStopDisabled,
  handleNext,
  handlePrevious,
  handleStartOver,
  handleStop,
  handleUntilEnd
}) =>
  <div className="Section-control btn-group columns">
    <style jsx>{`
      div {
        padding: 0px 10px;
      }
    `}</style>
    <button
      onClick={handleStartOver}
      disabled={isStartOverDisabled}
      className="btn btn-primary"
    >
      Start
    </button>
    <button
      onClick={handleStop}
      disabled={isStopDisabled}
      className="btn btn-primary"
    >
      Stop
    </button>
    <button
      onClick={handleNext}
      disabled={isNextDisabled}
      className="btn btn-primary"
    >
      Next
    </button>
    <button
      onClick={handlePrevious}
      disabled={isPreviousDisabled}
      className="btn btn-primary"
    >
      Previous
    </button>
  </div>;
