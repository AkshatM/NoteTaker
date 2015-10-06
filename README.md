# About

This is a note-taking app that lets you take notes, built with React and Semantic UI.

# Usage

Just open `index.html`, and see the magic!

# Development

If you feel you want to change the code, I generally find the best way is to edit the JSX in the jsx/ folder and allow Babel or the (now obsolete) [react-tools](https://facebook.github.io/react/blog/2015/06/12/deprecating-jstransform-and-react-tools.html) on NPM to automatically build to the build/ folder.

With react-tools, type into a terminal while on the root directory:

```
jsx --watch jsx/ build/ [--no-cache-dir]
```
where the `--no-cache-dir` prevents the creation of a cache directory containing a history of your previous builds. You can enable it if you want, but for a project of this size it just gets in the way.
 
If using Babel from NPM  instead:

```
babel jsx/ --watch --build/ build
```

(although please consult the [docs](https://facebook.github.io/react/docs/getting-started.html)).

# Features

- Mobile-optimised, with separate look and feel in mobile and web browsers.
- Persistent client-side storage. Your notes don't go away if you refresh - so long as you use the same browser to access it (and don't delete your cache!), you should be fine.
- Cross-browser compliance.

# Technologies

- React.js
- Semantic UI
- Moment.js (for time/date support)
- PersistJS (for client-side persistent storage)

In addition, it *attempts* to imitate Flux architecture by tightly integrating changes in local state with changes in a global store. It's not perfect (because there are no event listeners attached to changes in global store), but it does the job sufficiently well.

# How it Works

## Overview
Notes are organised as Semantic UI cards, which are widgets with the unique distinction of being mobile-first. The content of each card is rendered as a `contenteditable` div, allowing the user to simply type in his notes and proceed. Notes can be deleted and added on whim, and all notes are timestamped with the moment they were created. Semantic UI's `stackable` container allows a flexible gridlike display of these cards.

A global store keeps track of the *state* of each card. The store itself is organised as an `Array` of `Objects` - each object represents a card, and contains the timestamp of the card as well as its contents. The order of these objects corresponds to the ordering of each card in the grid. The store itself is a PersistJS global store - such a store degrades gracefully through browser-supported storage options, starting from a default of `localStorage` and, if not found, moving on steadily through `sessionStorage` and finally to other options.

Each card features `onInput` and `onBlur` event handlers that keep themselves synchronised with the global state. In other words, if a user alters the content even slightly, the change is noted and preserved forever, overwriting the contents of their past (this is not a versioning system, which is good, because that gets complicated really quickly).

## React-specific

Where does React tie into all of this? React renders each individual note and keeps track of interactions between them. When a user adds a note, for instance, React responds by rendering a new note; when a user deletes a note, React deletes the note in-place and shuffles the indexes of each card to compensate for the loss of their comrade.

The React hierarchy is structured as follows:
- A `<NoteContainer />` object is created that functions as the stackable grid. Notes are rendered as children of this object. The `<NoteContainer />` keeps its state synchronised with the global object store (so the two are always identical) - on each re-render, it consults its state and spins off cards based on what it finds there[1]. 
  
  Why does it consult state, and not the global store? Because changes in state trigger a re-render, making our `<NoteContainer />` respond to additions and deletions - the same is not true for changes in global state. Keeping the two synchronised at all times and allowing additions and deletions to trigger a re-render by mutating state is the best way to make the `<NoteContainer />` respond smoothly to change.

- `<NewCard />` objects are the physical manifestation of notes. They accept `props` indicating what their content should be, but do not themselves possess any state. They contain `<ContentEditable />` objects as children.

- `<ContentEditable />` objects are exactly as their name indicates: content-editable `<divs>`. They host all of our main content. Special support is needed because of their `onInput` and `onBlur` event handlers, hence why these are abstracted out as children.

`<ContentEditables />` update the global object representing their card, but do not change the global store's length or their card's position. `<NewCards />` alone have the special power to ask `<NoteContainer />` to destroy themselves, but they themselves cannot add a new card. Finally, only `<NoteContainer />` has the power to add a card or delete a card upon request.

# Why These Technologies?

## React

React is purely client-side, features a powerful and simple object model based on finite state machines optimised for rapid development, and operates as pure Javascript. It also does not take a toll on browsers, and CDNs for it already exist. Those were the reasons I finally chose React.

## Semantic UI

I had decided on a card-based design early on, and Semantic UI was the only framework I knew that featured mobile-optimised cards. Bootstrap v4 cards were an early choice, but simple experimentation revealed that they were not optimised for mobile, distorting and stretching their content unnaturally when the viewport was decreased (which is, I imagine, what you get for using an alpha release). 

I ended up teaching myself Semantic UI as a consequence of this decision, and managed to quickly rig up a simple card interface that looked presentable.

## Moment.js

Notes are useless if you don't know when you took them. Moment.js allowed for simple time/date formatting that instantly allowed for some sense of temporal ordering across notes. It works cross-browser and remains an industry standard.

## PersistJS

A large number of persistent client-side storage frameworks exist (such as Lawnchair.js or Amplify.js), and I had never worked with client-side storage before. I ultimately chose PersistJS for two reasons:

- It supported a simple and familiar setter/getter syntax, which was exactly what I needed. A surprisingly large number of client-side storage frameworks do not subscribe to this model (notably Lawnchair and Lawnchair-inspired solutions), which can make learning them complicated. PersistJS was easy to pick up.

- PersistJS is heavily cross-browser compliant, featuring graceful degradation *a la* Lawnchair. The other contender in terms of broad reach , Amplify.JS, did not appear to support a clean intuitive getter/setter syntax.

Cross-browser compliance, performance and ease of use eventually won out in PersistJS' favour.

# Issues I Faced (And Solved) 

By far, the biggest issue with React is its difficulty in supporting `contentEditable` in child objects. Updating a parent with `contentEditable` content results in a warning, and can lead to unexpected consequences owing to React's diffing algorithm (React uses a virtual DOM model and heuristics to greatly optimise tree transformation - contenteditable components create edge-cases that make for messy re-rendering on a change in the parent's state).
 
In particular, my issue came when I was trying to delete notes. Notes that the user had not interacted with (e.g. whose contenteditables had never gained focus from the user) would delete *other*  notes and take on their content instead - this happened because, again, during the re-rendering process, React would compute the bare minimum number of changes needed, and would decide that the bare minimum was best served by duplicating old content while deleting its container. 

This wasn't an intractable problem - the global object store always remembered the correct configuration of cards, and correcting this issue simply meant consulting the global object store to correct misbehaviour. 

I had two options:

- A simple browser refresh (which forces the component to unmount itself and re-mount in its original state, which is synchronised with global state) would have solved this problem, but was unacceptable from a user-experience standpoint. 

- Instead of consulting local state in the rendering process, I could have consulted the global object store instead while spinning off new cards. While this seemed to be the cleaner solution, it did not guarantee issues with re-rendering would not be solved - React may once again foil me with its diffing algorithm. 

After several unsuccessful attempts to work around this problem, I finally hit upon a drastic solution - after a successful update in state, I *unmounted* and *remounted* the `<NoteContainer />` in the same node, effectively achieving the same effect as refreshing the browser with no cost to user experience. This was not a clean solution - it meant forcing React to throw away its optimised diffing algorithm and rendering all of the notes each time a single note was deleted - but it had the advantage of working and was not too expensive on the browser (indeed, for a small number of notes, the performance improvement in a minimal diff is insignificant compared to rendering it all from scratch). 

So not a clean solution - but the performance hit is minimal, it is guaranteed correct, and you can't really tell the difference from a user's perspective. 
