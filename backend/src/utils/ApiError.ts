//Error structure , Error class is provided by node.js , which already has message , stack , name
 

//ApiError is our class name which is a special kind of Error

class ApiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong", // if someone not passes message , this line will be shown
    errors = [], //array for validation or multiple errors
    stack = "" //error stack (where the error happend)
  ) {
    super(message); //This calls the Error class,which has message in its constructor
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor); // this.constructor === ApiError
    }
  }
}

export { ApiError };

//super is a keyword in classes to call the constructor or access the properties and methods of a parent (superclass) 
//this = this object 
//super = the parent
  
//In a child class constructor, you must call super() before using this.  

//Error.captureStackTrace(target, constructorOpt)
//target → where to attach the stack
// constructorOpt → hide stack frames above this constructor

