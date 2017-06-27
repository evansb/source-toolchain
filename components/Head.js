import NextHead from 'next/head'
import PropTypes from 'prop-types'

const Head = ({ title }) =>
  <NextHead>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <meta name="theme-color" content="#000000" />
    <link rel="manifest" href="/static/manifest.json" />
    <link rel="shortcut icon" href="/static/favicon.ico" />
    <link rel="stylesheet" href="/static/css/spectre.min.css" />
    <link rel="stylesheet" href="/static/css/spectre-exp.min.css" />
    <title>{title}</title>
    <style>{`
      @import url('https://fonts.googleapis.com/css?family=Noto+Sans');

      body {
        margin: 0;
        padding: 0;
        font-family: 'Noto Sans', sans-serif;
        background-color: #161824;
      }

      h1,h2,h3,h4,h5,h6 {
        color: white;
        letter-spacing: 0.8px;
      }

      .container {
        margin: 0 auto;
        max-width: 960px;
      }

      .Editor-highlight {
        position: absolute;
        z-index: 20;
        background: #5764c6;
        opacity: 0.5;
        border-radius: 0 !important;
      }

      .Editor-highlight-error {
        position: absolute;
        z-index: 20;
        border-bottom: 3px dotted #FF5B92;
        border-radius: 0 !important;
      }
    `}</style>
  </NextHead>

Head.propTypes = {
  title: PropTypes.string.isRequired
}

export default Head
