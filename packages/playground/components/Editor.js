import { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'

class Editor extends Component {
  componentDidMount() {
    const ace = require('brace')
    require('brace/mode/javascript')
    require('ayu-ace')
    window.Range = ace.acequire('ace/range').Range
    const editor = ace.edit(this.editorContainer)
    editor.getSession().setUseWorker(false)
    editor.getSession().setMode('ace/mode/javascript')
    editor.setTheme('ace/theme/ayu-mirage')
    editor.$blockScrolling = Infinity
    editor.setOptions({
      fontSize: '14px'
    })
    editor.setValue(this.props.initialValue)
    editor.clearSelection()
    editor.on('change', () => {
      this.props.onChange()
    })
    this.props.onReady(editor)
  }

  render() {
    const height = this.props.height || '300px'
    return (
      <div>
        <div style={{height}} ref={(ref) => this.editorContainer = ref } />
      </div>
    )
  }
}

Editor.propTypes = {
  initialValue: PropTypes.string,
  height: PropTypes.string,
  onReady: PropTypes.func,
  onChange: PropTypes.func
}

export default Editor
