export const fetchProperties = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_PROPERTIES_REQUEST' });
    try {
      const response = await fetch('https://api.example.com/properties');
      const data = await response.json();
      dispatch({ type: 'FETCH_PROPERTIES_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_PROPERTIES_FAILURE', error });
    }
  };
};
