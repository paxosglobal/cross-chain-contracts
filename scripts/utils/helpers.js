// Helper functions for the deploy scripts.

// Throws an error if any of the arguments are falsy or undefined.
function ValidateEnvironmentVariables(args) {
    for (const arg of args) {
      if (!arg) {
        throw new Error('Missing environment variable');
      }
    }
}
  
module.exports = {
    ValidateEnvironmentVariables,
}