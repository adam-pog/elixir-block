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
    this.onMatchableKeyword();
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
    potentialMatchables = tokens.filter(token => this.controlToken(token));

    if(this.matchableDefiningToken(potentialMatchables) || this.matchableFnToken(potentialMatchables)) {
      this.highlightMatchingEndToken();
    } else if(this.matchableEndToken(potentialMatchables)) {
      this.highlightMatchingDefineToken();
    }
  },

  fnToken(token) {
    return token.value == 'fn';
  },

  endToken(token) {
    return token.value == 'end';
  },

  controlToken(token) {
    return ['meta.module.elixir','keyword.control.elixir'].includes(token.scopes[1]);
  },

  matchableDefiningToken(tokens) {
    return tokens.length > 1 && !this.fnToken(tokens[0]);
  },

  matchableEndToken(tokens) {
    return tokens.length && this.endToken(tokens[0]);
  },

  matchableFnToken(tokens) {
    return tokens.length == 1 && this.fnToken(tokens[0]);
  },

  highlightMatchingDefineToken() {
    console.log('finding define')
  },

  highlightMatchingEndToken() {
    console.log('finding end')
  }

};

//no
// 1:"constant.other.symbol.elixir"
// 0:"source.elixir"

//yes
// 0:"source.elixir"
// 1:"keyword.control.elixir"
