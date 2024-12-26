import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers/rootReducer'; // Root reducer combining all reducers

const store = createStore(rootReducer, applyMiddleware());

export default store;
