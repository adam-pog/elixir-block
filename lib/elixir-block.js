'use babel';

import ElixirBlockView from './elixir-block-view';
import { CompositeDisposable } from 'atom';

export default {

  elixirBlockView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.elixirBlockView = new ElixirBlockView(state.elixirBlockViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.elixirBlockView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    // this.subscriptions.add(atom.commands.add('atom-workspace', {
    //   'elixir-block:toggle': () => this.toggle()
    // }));

    console.log('ElixirBlock was toggled!');
    this.editor = atom.workspace.getActiveTextEditor();
    this.grammar = this.editor.getGrammar();
    parent = this
    this.editor.onDidChangeCursorPosition(function() {
      parent.findMatch()
    });
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.elixirBlockView.destroy();
  },

  serialize() {
    return {
      elixirBlockViewState: this.elixirBlockView.serialize()
    };
  },

  findMatch() {
    this.removeMarker();
    console.log(this.onMatchableKeyword());
    // this.marker = this.editor.markBufferRange([[currentLine + 2, text.search(/\S/)], [currentLine + 2, text.length]])
    // this.editor.decorateMarker(this.marker, {type: 'highlight', class: 'elixir-block'})
  },

  removeMarker() {
    if(this.marker) { this.marker.destroy() }
  },

  onMatchableKeyword() {
    currentLine = this.editor.getLastCursor().getBufferRow();
    text = this.editor.lineTextForBufferRow(currentLine);
    tokens = this.grammar.tokenizeLine(text).tokens;
    potentialTokens = tokens.filter(token => this.controlToken(token));

    if(potentialTokens.length == 1) {
      return this.fnToken(potentialTokens[0])
    } else {
      return potentialTokens.length > 1 && !this.fnToken(potentialTokens[0])
    }
  },

  fnToken(token) {
    return token.value == 'fn'
  },

  controlToken(token) {
    return ['meta.module.elixir','keyword.control.elixir'].includes(token.scopes[1])
  }
};

//no
// 1:"constant.other.symbol.elixir"
// 0:"source.elixir"

//yes
// 0:"source.elixir"
// 1:"keyword.control.elixir"
