import { combineReducers } from 'redux';
import propertyReducer from './propertyReducer'; // Your reducer file

const rootReducer = combineReducers({
  property: propertyReducer,
});

export default rootReducer;
