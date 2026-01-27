const requestHandler = (fn) => {//accept the function and return the function
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); 
  };
};


export default requestHandler
