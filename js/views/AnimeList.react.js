/** @jsx React.DOM */
'use strict';

import React from 'react/addons';
import AnimeCache from '../AnimeCache.js';
import LibraryItemComponent from './LibraryItem.react.js';
import AnimeItemComponent from './AnimeItem.react.js';
import AnimeAirDate from '../AnimeAirDate.js';
import HummingbirdAnimeList from '../HummingbirdAnimeList.js';

/**
 * @property {string} username
 * @property {string} tab
 * @property {string} filterText
 * @property {Array.<Anime>} searchList
 * @property {integer} maxLibraryItems
 * @property {integer} itemIncrement
 * @property {function()} onMoreClicked
 */
var AnimeListComponent = React.createClass({
  inLibrary: {},

  getInitialState: function() {
    this.HummingbirdApi = new HummingbirdAnimeList(this.props.username, () => {
      var library = this.HummingbirdApi.getList();
      for (var i = 0; i < library.length; i++) {
        AnimeCache.addAnime(library[i].anime.id);
      }
      this.setState({ loading: false, animelist: this.HummingbirdApi.getList() });
    }, (err) => console.log(err));

    return {
      loading: true,
      animelist: null
    };
  },

  /**
   * Returns the index of an anime in the animelist
   * @param {integer} animeid the id of the anime to find
   * @return {integer} the index of the anime in the animelist or -1 if anime is not in the list
   */
  getLibraryIndex: function(animeid) {
    var libraryIndex = -1;
    for (var i = 0; i < this.state.animelist.length; i++) {
      if (animeid === this.state.animelist[i].anime.id) {
        libraryIndex = i;
        break;
      }
    }
    return libraryIndex;
  },

  /**
   * Adds/updates library items to the animelist
   * @param {integer} animeid the id of the anime to update/add
   * @param {Object} updateparams the parameters to pass through the api
   */
  update: function(animeid, updateparams) {
    return HummingbirdAnimeList.update(animeid, updateparams).then((libraryItem) => {
      var libraryIndex = this.getLibraryIndex(animeid);
      if (libraryIndex !== -1) { // set existing anime
        var changeOptions = {};
        changeOptions[libraryIndex] = {
          $set: libraryItem
        };
        var newlist = React.addons.update(this.state.animelist, changeOptions);
        this.setState({ animelist: newlist });
      } else { // add new anime
        var newlist = React.addons.update(this.state.animelist, { $push: [libraryItem] });
        AnimeCache.addAnime(animeid);
        this.setState({ animelist: newlist });
      }
    });
  },

  /**
   * Removes library items from the animelist
   * @param {integer} animeid the id of the anime to remove
   */
  remove: function(animeid) {
    return HummingbirdAnimeList.removeFromList(animeid).then(() => {
      var libraryIndex = this.getLibraryIndex(animeid);

      if (libraryIndex !== -1) {
        var newlist = React.addons.update(this.state.animelist, { $splice: [[libraryIndex, 1]] });
        AnimeCache.removeAnime(animeid);
        this.setState({ animelist: newlist });
      } else {
        throw new Error('Removed item is not in the library');
      }
    });
  },

  onAirDayChanged: function(newDay) {
    this.forceUpdate();
  },

  render: function() {
    if (this.state.loading) {
      return <h1>Loading data....</h1>
    } else {
      var libraryIndexes = [];
      var current_date = new Date();

      var filteredTabLibrary = null;

      if (this.props.tab === 'all') {
        filteredTabLibrary = this.state.animelist;
      } else {
        filteredTabLibrary = this.state.animelist.filter((libraryItem) => {
          return libraryItem.status === this.props.tab;
        }).sort(HummingbirdAnimeList.compareLibraryItems);
      }

      if (this.props.filterText !== '') {
        filteredTabLibrary = filteredTabLibrary.filter((libraryItem) => {
          return libraryItem.anime.title.search(new RegExp(this.props.filterText, 'i')) > -1;
        });
      }

      var filteredLibrary = filteredTabLibrary.slice(0, this.props.maxLibraryItems).map((libraryItem, index) => {
        return <LibraryItemComponent key={libraryItem.anime.id} 
                                     libraryItem={libraryItem} 
                                     update={this.update}
                                     remove={this.remove}
                                     onAirDayChanged={this.onAirDayChanged}/>
      });

      var searchLibrary = this.props.searchList.map((anime) => {
        if (!AnimeCache.inCache(anime.id)) {
          return <AnimeItemComponent key={anime.id} tab={this.props.tab} anime={anime} update={this.update}/>
        }
      });

      var moreButton = null;

      if (filteredTabLibrary.length > this.props.maxLibraryItems) {
        moreButton = (
          <input type="button" className="btn btn-default btn-lg btn-block" onClick={this.props.onMoreClicked} value="Load more library items"></input>
        );
      }


      return (
        <div>
          <ul id="anime-list" className="list-group">
            {filteredLibrary}
            {moreButton}
            {searchLibrary}
          </ul>
        </div>
      );
    }
  }
});

export default AnimeListComponent;
