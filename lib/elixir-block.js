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

    self = this

    this.subscriptions.add(atom.workspace.observeActiveTextEditor(function(editor) {
      if(this.editorSubscription) { this.editorSubscription.dispose(); }
      if(!editor){ return }

      self.editor = editor;
      self.grammar = self.editor.getGrammar();
      if(self.grammar.name == 'Elixir'){
        this.editorSubscription = self.editor.onDidChangeCursorPosition(function() {
          self.bufferLength = self.editor.getBuffer().getRange().end.row
          self.findMatch()
        });
      }
    }));
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
      this.highlightMatchingEndToken(currentLine + 1);
    } else if(this.matchableEndToken(potentialMatchables)) {
      this.highlightMatchingDefineToken(currentLine - 1);
    }
  },

  fnToken(token) {
    return token.value == 'fn';
  },

  endToken(token) {
    return token.value == 'end';
  },

  controlToken(token) {
    // 'meta.module.elixir handles defmodule. All other relevant tokens are control'
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

  highlightMatchingDefineToken(currentLine) {
    loopConditionFunc = (lineNum) => ( lineNum > -1 )
    matchableExistsFunc = (potentialMatchables) => (
      this.matchableDefiningToken(potentialMatchables) || this.matchableFnToken(potentialMatchables)
    )
    pushStackFunc = (potentialMatchables) => ( this.matchableEndToken(potentialMatchables) )
    nextLineFunc = (lineNum) => ( lineNum - 1 )

    this.highlightMatchingToken(currentLine, loopConditionFunc, matchableExistsFunc, pushStackFunc, nextLineFunc);
  },

  highlightMatchingEndToken(currentLine) {
    loopConditionFunc = (lineNum) => ( lineNum < this.bufferLength )
    pushStackFunc = (potentialMatchables) => (
      this.matchableDefiningToken(potentialMatchables) || this.matchableFnToken(potentialMatchables)
    )
    matchableExistsFunc = (potentialMatchables) => ( this.matchableEndToken(potentialMatchables) )
    nextLineFunc = (lineNum) => ( lineNum + 1 )

    this.highlightMatchingToken(currentLine, loopConditionFunc, matchableExistsFunc, pushStackFunc, nextLineFunc);
  },

  // genericized matching function. Accepts custom functions to allow matching either 'defining' tokens or 'end' tokens
  highlightMatchingToken(currentLine, loopConditionFunc, matchableExistsFunc, pushStackFunc, nextLineFunc) {
    tokenStack = []

    for(lineNum = currentLine; loopConditionFunc(lineNum); lineNum=nextLineFunc(lineNum)){
      text = this.editor.lineTextForBufferRow(lineNum);
      tokens = this.grammar.tokenizeLine(text).tokens;
      potentialMatchables = tokens.filter(token => this.controlToken(token));

      if(pushStackFunc(potentialMatchables)) { tokenStack.push('token') }
      if(matchableExistsFunc(potentialMatchables)) {
        if(tokenStack.length > 0) {
          tokenStack.pop();
        } else{
          this.markLine(lineNum, text);
          return;
        }
      }
    }
  },

  markLine(lineNum, text) {
    this.marker = this.editor.markBufferRange([[lineNum, text.search(/\S/)], [lineNum, text.length]])
    this.editor.decorateMarker(this.marker, {type: 'highlight', class: 'elixir-block'})
  }
};
