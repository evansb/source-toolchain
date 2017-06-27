export default () =>
  <header className="App-header">
    <style jsx>{`
      div {
        color: white;
      }
      header {
        background-color: #272134;
        padding: 50px;

        color: #fafafa;
      }
      .logo {
        width: 100px;
        margin: 0 auto;
      }
      .logo img {
        width: 100%;
        height: 100%;
      }
      .subtitle {
        font-size: 0.5em;
        margin-left: 0.3em;
        color: #5BFF92;
        font-weight: 700;
        text-transform: uppercase;
      }
      .subheading {
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 2em;
      }
      .btn {
        margin-right: 10px;
        padding: 10px 20px;
        font-weight: 700;
        text-shadow: -1px -1px 0 #272134,
          1px -1px 0 #272134,
          -1px 1px 0 #272134,
          1px 1px 0 #272134;
      }
    `}</style>
    <div className="container columns">
      <div className="column col-2 col-sm-12">
        <div className="logo">
          <img alt="Logo" src="/static/images/logo.png" className="img-fit" />
        </div>
      </div>
      <div className="column col-10 col-sm-12">
        <h2>source<span className="subtitle">toolchain</span></h2>
        <h6 className="subheading">
          Toolkit for Learning Programming Using JavaScript
        </h6>
        <a
          href="https://github.com/evansb/source-toolchain"
          className="btn btn-primary btn-lg"
        >
          Try It
        </a>
        <a
          href="https://github.com/evansb/source-toolchain"
          className="btn btn-primary btn-lg"
        >
          View on GitHub
        </a>
      </div>
    </div>
  </header>
