/* global describe, it, beforeEach, afterEach */

import React, {Component} from 'react';
import {Sagas, Saga} from '../src/sagas';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import {Provider} from 'react-redux';
import {render, unmountComponentAtNode} from 'react-dom';
import createSagaMiddleware, {cps, SagaCancellationException} from 'redux-saga';

import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

function sleep(period, done){
  setTimeout(() => done(null, true), period);
}

class SagaRoot extends Component{
  sagaMiddleware = createSagaMiddleware();
  store = createStore(
    combineReducers(this.props.reducers || {x: (x = {}) => x}),
    applyMiddleware(this.sagaMiddleware)
  );
  render(){
    return <Provider store={this.store}>
      <Sagas middleware={this.sagaMiddleware}>
        {this.props.children}
      </Sagas>
    </Provider>;
  }
}

describe('react-redux-saga', () => {
  let node;
  beforeEach(() => node = document.createElement('div'));
  afterEach(() => unmountComponentAtNode(node));

    // sagas
  it('accepts a saga', done => {
    let started = false;

    class App extends Component{
      *saga(){
        started = true;
        yield cps(sleep, 300);
        done();
      }
      render(){
        return <Saga saga={this.saga}/>;
      }
    }
    expect(started).toEqual(false);

    render(<SagaRoot><App /></SagaRoot>, node);
    expect(started).toEqual(true);
  });

  it('starts when the component is mounted', () => {
    // as above
  });

  it('gets cancelled when the component unmounts', done => {
    let unmounted = false;

    class App extends Component{
      *saga(){
        try {
          while (true){
            yield cps(sleep, 100);
          }
        }
        catch (e){
          if (e instanceof SagaCancellationException && unmounted === true){
            done();
          }
        }
      }
      render(){
        return <Saga saga={this.saga} />;
      }
    }

    render(<SagaRoot><App /></SagaRoot>, node);

    sleep(500, () => {
      unmounted = true;
      unmountComponentAtNode(node);
    });


  });

  it('can receive props', done => {
    class App extends Component{
      *saga(_, {x}){
        expect(x).toEqual(123);
        done();
      }
      render(){
        return <Saga saga={this.saga} x={123} />;
      }
    }

    render(<SagaRoot><App/></SagaRoot>, node);
  });

  it('can read from global redux state', done => {

    class App extends Component{
      *saga(getState){
        expect(getState().x.a).toEqual(123);
        done();
      }
      render(){
        return <Saga saga={this.saga} />;
      }
    }

    render(<SagaRoot reducers={{x: (state = {a: 123}) => state}}>
      <App/>
    </SagaRoot>, node);

  });
});
