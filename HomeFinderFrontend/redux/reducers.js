import { combineReducers } from '@reduxjs/toolkit';
import propertyReducer from './propertyReducer';
import userReducer from './userReducer';
// Import other reducers

const rootReducer = combineReducers({
  property: propertyReducer,
  user: userReducer,
  // Add other reducers
});

export default rootReducer;