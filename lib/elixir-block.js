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
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'elixir-block:toggle': () => this.toggle()
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

  toggle() {
    console.log('ElixirBlock was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
