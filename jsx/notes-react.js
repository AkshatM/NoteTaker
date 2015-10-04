/* Doing things with React */

var ContentEditable = React.createClass({
    
    handleChange: function(){
        
        var cards = JSON.parse(store.get("cards"));

        cards[this.props.index][this.props.classname] = this.getDOMNode(this).textContent;

        store.set("cards",JSON.stringify(cards));
    },
    
    render: function(){
        return (
            <div className = {this.props.classname} contentEditable="true" onInput = {this.handleChange} onBlur = {this.handleChange}>
            {this.props.content}
            </div>
        );
    }
    
});

var NewCard = React.createClass({

    render: function() {
        
        return (
            <div className="card">
                <div className="content">
                    <div className="meta">
                        <span className="right floated action"><a href = "#" onClick={this.props.deletefunc}>Delete?</a></span>
                        <span className="time">{this.props.time}</span>
                        
                    </div>
                    <ContentEditable refs="description" index = {this.props.index} classname = "description" content = {this.props.description} />
                </div>
            </div>
        );
    }
    
});

var NotesContainer = React.createClass({
    
    // If there is already a saved global state, start with that
    // - otherwise, start with no cards
    getInitialState: function(){
        
        // save it! We want to always keep global store and state in sync -
        // state will ensure the right number of cards is always visible,
        // the global store will ensure their content is preserved. If they
        // are out of sync, bad things will happen.
        
        // This is a crude simulacrum of Flux: in particular, it simulates
        // an event listener.
        if (!store.get("cards")) {
             store.set("cards", JSON.stringify([]));
        }
        
        return {
            cards: JSON.parse(store.get('cards'))
        };
    },
    
    // when delete button is clicked in a card, remove it from existence
    // Each card is indexed by a value, indicating which array position it is.
    deleteNote: function(i){
        
        this.setState(
            
            function(previousState, currentProps) {
                
                // copy current state from global store
                var updated_state = JSON.parse(store.get("cards"));

                // remove old element from our copy of current state.
                updated_state.splice(i,1);

                // persist this updated copy in store
                store.set('cards',JSON.stringify(updated_state));

                // update state to trigger re-render
                return {
                    cards: updated_state
                };
            });
    },
    
    componentDidUpdate: function(previousProps, previousState){
        if (this.state.cards.length < previousState.cards.length){
            refresh();
        }
    },
    
    // when our add button is clicked, append a new card to our internal state.
    addNote: function(){
        
        this.setState(
            
            function(previousState, currentProps) {
                
                // copy old array
                var updated_state = JSON.parse(store.get("cards"));
                var current_time = moment().format("MMM Do YY, hh:mm:ss a")

                // add new element to our copy of old array 
                updated_state.push({
                        time: current_time,
                        description: 'Click on the content or the title to edit it!'
                    });

                // persist this updated copy in store
                store.set('cards', JSON.stringify(updated_state));
                
                // update state to trigger re-render
                return {
                    cards: updated_state
                };
            });
    },
    
    // render a series of notes
    render: function() {
    
        return (
            <div className="ui three stackable cards">
                  {this.state.cards.map(function(card, i) {
                          return (
                                    <NewCard key = {i} index = {i} deletefunc = {this.deleteNote.bind(this,i)} header = {card.header} description = {card.description} time = {card.time} />
                                      );
                  }, this)}
                  <div className="card">
                       <button className="ui primary button" onClick={this.addNote}> Add a new note</button>
                  </div>
            </div>
        );
    }
    
});

// create a global store!
var store;

function load_data() {
  // load persistent store after the DOM has loaded
  store = new Persist.Store('My Application');
  React.render(<NotesContainer />, document.getElementById("note-container"));
}

function refresh(){
  React.unmountComponentAtNode(document.getElementById("note-container"));
  React.render(<NotesContainer />, document.getElementById("note-container"));
}