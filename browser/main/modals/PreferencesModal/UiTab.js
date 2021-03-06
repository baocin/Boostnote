import PropTypes from 'prop-types'
import React from 'react'
import CSSModules from 'browser/lib/CSSModules'
import styles from './ConfigTab.styl'
import ConfigManager from 'browser/main/lib/ConfigManager'
import store from 'browser/main/store'
import consts from 'browser/lib/consts'
import ReactCodeMirror from 'react-codemirror'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import _ from 'lodash'
import i18n from 'browser/lib/i18n'

const OSX = global.process.platform === 'darwin'

const electron = require('electron')
const ipc = electron.ipcRenderer

class UiTab extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      config: props.config,
      codemirrorTheme: props.config.editor.theme
    }
  }

  componentDidMount () {
    CodeMirror.autoLoadMode(this.codeMirrorInstance.getCodeMirror(), 'javascript')
    this.handleSettingDone = () => {
      this.setState({UiAlert: {
        type: 'success',
        message: i18n.__('Successfully applied!')
      }})
    }
    this.handleSettingError = (err) => {
      this.setState({UiAlert: {
        type: 'error',
        message: err.message != null ? err.message : 'Error occurs!'
      }})
    }
    ipc.addListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.addListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  componentWillUnmount () {
    ipc.removeListener('APP_SETTING_DONE', this.handleSettingDone)
    ipc.removeListener('APP_SETTING_ERROR', this.handleSettingError)
  }

  handleUIChange (e) {
    const { codemirrorTheme } = this.state
    let checkHighLight = document.getElementById('checkHighLight')

    if (checkHighLight === null) {
      checkHighLight = document.createElement('link')
      checkHighLight.setAttribute('id', 'checkHighLight')
      checkHighLight.setAttribute('rel', 'stylesheet')
      document.head.appendChild(checkHighLight)
    }

    const newConfig = {
      ui: {
        theme: this.refs.uiTheme.value,
        language: this.refs.uiLanguage.value,
        showCopyNotification: this.refs.showCopyNotification.checked,
        confirmDeletion: this.refs.confirmDeletion.checked,
        disableDirectWrite: this.refs.uiD2w != null
          ? this.refs.uiD2w.checked
          : false
      },
      editor: {
        theme: this.refs.editorTheme.value,
        fontSize: this.refs.editorFontSize.value,
        fontFamily: this.refs.editorFontFamily.value,
        indentType: this.refs.editorIndentType.value,
        indentSize: this.refs.editorIndentSize.value,
        displayLineNumbers: this.refs.editorDisplayLineNumbers.checked,
        switchPreview: this.refs.editorSwitchPreview.value,
        keyMap: this.refs.editorKeyMap.value,
        scrollPastEnd: this.refs.scrollPastEnd.checked,
        fetchUrlTitle: this.refs.editorFetchUrlTitle.checked
      },
      preview: {
        fontSize: this.refs.previewFontSize.value,
        fontFamily: this.refs.previewFontFamily.value,
        codeBlockTheme: this.refs.previewCodeBlockTheme.value,
        lineNumber: this.refs.previewLineNumber.checked,
        latexInlineOpen: this.refs.previewLatexInlineOpen.value,
        latexInlineClose: this.refs.previewLatexInlineClose.value,
        latexBlockOpen: this.refs.previewLatexBlockOpen.value,
        latexBlockClose: this.refs.previewLatexBlockClose.value,
        scrollPastEnd: this.refs.previewScrollPastEnd.checked,
        smartQuotes: this.refs.previewSmartQuotes.checked
      }
    }

    const newCodemirrorTheme = this.refs.editorTheme.value

    if (newCodemirrorTheme !== codemirrorTheme) {
      checkHighLight.setAttribute('href', `../node_modules/codemirror/theme/${newCodemirrorTheme.split(' ')[0]}.css`)
    }
    this.setState({ config: newConfig, codemirrorTheme: newCodemirrorTheme }, () => {
      const {ui, editor, preview} = this.props.config
      this.currentConfig = {ui, editor, preview}
      if (_.isEqual(this.currentConfig, this.state.config)) {
        this.props.haveToSave()
      } else {
        this.props.haveToSave({
          tab: 'UI',
          type: 'warning',
          message: i18n.__('You have to save!')
        })
      }
    })
  }

  handleSaveUIClick (e) {
    const newConfig = {
      ui: this.state.config.ui,
      editor: this.state.config.editor,
      preview: this.state.config.preview
    }

    ConfigManager.set(newConfig)

    store.dispatch({
      type: 'SET_UI',
      config: newConfig
    })
    this.clearMessage()
    this.props.haveToSave()
  }

  clearMessage () {
    _.debounce(() => {
      this.setState({
        UiAlert: null
      })
    }, 2000)()
  }

  render () {
    const UiAlert = this.state.UiAlert
    const UiAlertElement = UiAlert != null
      ? <p className={`alert ${UiAlert.type}`}>
        {UiAlert.message}
      </p>
      : null

    const themes = consts.THEMES
    const { config, codemirrorTheme } = this.state
    const codemirrorSampleCode = 'function iamHappy (happy) {\n\tif (happy) {\n\t  console.log("I am Happy!")\n\t} else {\n\t  console.log("I am not Happy!")\n\t}\n};'
    return (
      <div styleName='root'>
        <div styleName='group'>
          <div styleName='group-header'>{i18n.__('Interface')}</div>

          <div styleName='group-section'>
            {i18n.__('Interface Theme')}
            <div styleName='group-section-control'>
              <select value={config.ui.theme}
                onChange={(e) => this.handleUIChange(e)}
                ref='uiTheme'
              >
                <option value='default'>{i18n.__('Default')}</option>
                <option value='white'>{i18n.__('White')}</option>
                <option value='solarized-dark'>{i18n.__('Solarized Dark')}</option>
                <option value='dark'>{i18n.__('Dark')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            {i18n.__('Language')}
            <div styleName='group-section-control'>
              <select value={config.ui.language}
                onChange={(e) => this.handleUIChange(e)}
                ref='uiLanguage'
              >
                <option value='sq'>{i18n.__('Albanian')}</option>
                <option value='zh-CN'>{i18n.__('Chinese (zh-CN)')}</option>
                <option value='zh-TW'>{i18n.__('Chinese (zh-TW)')}</option>
                <option value='da'>{i18n.__('Danish')}</option>
                <option value='en'>{i18n.__('English')}</option>
                <option value='fr'>{i18n.__('French')}</option>
                <option value='de'>{i18n.__('German')}</option>
                <option value='ja'>{i18n.__('Japanese')}</option>
                <option value='ko'>{i18n.__('Korean')}</option>
                <option value='no'>{i18n.__('Norwegian')}</option>
                <option value='pl'>{i18n.__('Polish')}</option>
                <option value='pt'>{i18n.__('Portuguese')}</option>
                <option value='ru'>{i18n.__('Russian')}</option>
                <option value='es'>{i18n.__('Spanish')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.ui.showCopyNotification}
                ref='showCopyNotification'
                type='checkbox'
              />&nbsp;
              {i18n.__('Show "Saved to Clipboard" notification when copying')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.ui.confirmDeletion}
                ref='confirmDeletion'
                type='checkbox'
              />&nbsp;
              {i18n.__('Show a confirmation dialog when deleting notes')}
            </label>
          </div>
          {
            global.process.platform === 'win32'
            ? <div styleName='group-checkBoxSection'>
              <label>
                <input onChange={(e) => this.handleUIChange(e)}
                  checked={this.state.config.ui.disableDirectWrite}
                  refs='uiD2w'
                  disabled={OSX}
                  type='checkbox'
                />&nbsp;
                Disable Direct Write(It will be applied after restarting)
              </label>
            </div>
            : null
          }
          <div styleName='group-header2'>Editor</div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Theme')}
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.theme}
                ref='editorTheme'
                onChange={(e) => this.handleUIChange(e)}
              >
                {
                  themes.map((theme) => {
                    return (<option value={theme} key={theme}>{theme}</option>)
                  })
                }
              </select>
              <div styleName='code-mirror'>
                <ReactCodeMirror ref={e => (this.codeMirrorInstance = e)} value={codemirrorSampleCode} options={{ lineNumbers: true, readOnly: true, mode: 'javascript', theme: codemirrorTheme }} />
              </div>
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Font Size')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='editorFontSize'
                value={config.editor.fontSize}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Font Family')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='editorFontFamily'
                value={config.editor.fontFamily}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Indent Style')}
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.indentSize}
                ref='editorIndentSize'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='1'>1</option>
                <option value='2'>2</option>
                <option value='4'>4</option>
                <option value='8'>8</option>
              </select>&nbsp;
              <select value={config.editor.indentType}
                ref='editorIndentType'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='space'>{i18n.__('Spaces')}</option>
                <option value='tab'>{i18n.__('Tabs')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Switch to Preview')}
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.switchPreview}
                ref='editorSwitchPreview'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='BLUR'>{i18n.__('When Editor Blurred')}</option>
                <option value='DBL_CLICK'>{i18n.__('When Editor Blurred, Edit On Double Click')}</option>
                <option value='RIGHTCLICK'>{i18n.__('On Right Click')}</option>
              </select>
            </div>
          </div>

          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Editor Keymap')}
            </div>
            <div styleName='group-section-control'>
              <select value={config.editor.keyMap}
                ref='editorKeyMap'
                onChange={(e) => this.handleUIChange(e)}
              >
                <option value='sublime'>{i18n.__('default')}</option>
                <option value='vim'>{i18n.__('vim')}</option>
                <option value='emacs'>{i18n.__('emacs')}</option>
              </select>
              <p styleName='note-for-keymap'>{i18n.__('⚠️ Please restart boostnote after you change the keymap')}</p>
            </div>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.displayLineNumbers}
                ref='editorDisplayLineNumbers'
                type='checkbox'
              />&nbsp;
              {i18n.__('Show line numbers in the editor')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.scrollPastEnd}
                ref='scrollPastEnd'
                type='checkbox'
              />&nbsp;
              {i18n.__('Allow editor to scroll past the last line')}
            </label>
          </div>

          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.editor.fetchUrlTitle}
                ref='editorFetchUrlTitle'
                type='checkbox'
              />&nbsp;
              {i18n.__('Bring in web page title when pasting URL on editor')}
            </label>
          </div>

          <div styleName='group-header2'>Preview</div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Preview Font Size')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                value={config.preview.fontSize}
                ref='previewFontSize'
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('Preview Font Family')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewFontFamily'
                value={config.preview.fontFamily}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>{i18n.__('Code block Theme')}</div>
            <div styleName='group-section-control'>
              <select value={config.preview.codeBlockTheme}
                ref='previewCodeBlockTheme'
                onChange={(e) => this.handleUIChange(e)}
              >
                {
                  themes.map((theme) => {
                    return (<option value={theme} key={theme}>{theme}</option>)
                  })
                }
              </select>
            </div>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.preview.scrollPastEnd}
                ref='previewScrollPastEnd'
                type='checkbox'
              />&nbsp;
              {i18n.__('Allow preview to scroll past the last line')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.preview.lineNumber}
                ref='previewLineNumber'
                type='checkbox'
              />&nbsp;
              {i18n.__('Show line numbers for preview code blocks')}
            </label>
          </div>
          <div styleName='group-checkBoxSection'>
            <label>
              <input onChange={(e) => this.handleUIChange(e)}
                checked={this.state.config.preview.smartQuotes}
                ref='previewSmartQuotes'
                type='checkbox'
              />&nbsp;
              Enable smart quotes
            </label>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Inline Open Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexInlineOpen'
                value={config.preview.latexInlineOpen}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Inline Close Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexInlineClose'
                value={config.preview.latexInlineClose}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Block Open Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexBlockOpen'
                value={config.preview.latexBlockOpen}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>
          <div styleName='group-section'>
            <div styleName='group-section-label'>
              {i18n.__('LaTeX Block Close Delimiter')}
            </div>
            <div styleName='group-section-control'>
              <input styleName='group-section-control-input'
                ref='previewLatexBlockClose'
                value={config.preview.latexBlockClose}
                onChange={(e) => this.handleUIChange(e)}
                type='text'
              />
            </div>
          </div>

          <div styleName='group-control'>
            <button styleName='group-control-rightButton'
              onClick={(e) => this.handleSaveUIClick(e)}>{i18n.__('Save')}
            </button>
            {UiAlertElement}
          </div>
        </div>
      </div>
    )
  }
}

UiTab.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  dispatch: PropTypes.func,
  haveToSave: PropTypes.func
}

export default CSSModules(UiTab, styles)
