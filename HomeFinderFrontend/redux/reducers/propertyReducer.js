const initialState = {
  properties: [],
  loading: false,
  error: null,
};

const propertyReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_PROPERTIES_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_PROPERTIES_SUCCESS':
      return { ...state, loading: false, properties: action.payload };
    case 'FETCH_PROPERTIES_FAILURE':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export default propertyReducer;
