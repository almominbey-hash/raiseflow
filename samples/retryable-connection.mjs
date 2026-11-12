/** Share concurrent connection attempts; clear failed attempts so a later call retries. */
export function createConnectionManager(connect) {
  let connection;
  let pending;
  return async function getConnection() {
    if (connection) return connection;
    if (!pending) {
      pending = Promise.resolve().then(connect).then(result => {
        connection = result;
        return result;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  };
}
// Adapter example: createConnectionManager(() => mongoose.connect(process.env.MONGODB_URI))
// This handles initial failures. Established-connection recovery belongs to the driver.
