/**
 * Creates the mam options objects for a transaction
 * @constructor
 * @param mode {string} the mode the transaction is to accessed
 * @see [mode documentation]{@link https://docs.iota.org/docs/client-libraries/0.1/mam/introduction/overview#channel-types}
 * @param start {number} the mam position of the transaction
 * @param sidekey {string} the side key used to encrypt transaction
 */
function MamOptions(mode, start, sideKey) {
  // always initialize all instance properties
  this.mode = mode;
  this.side_key = sideKey;
  this.count = 0;
  this.next_count = 1;
  this.start = start;
  this.index = 0;
  this.security = 2;
}

// export the class
module.exports.MamOptions = MamOptions;
