/**
 * Creates an audit entry for a transaction
 * @constructor
 * @param id {string} id of audit entry
 * @param payload {object} payload of audit entry
 * @param resourceID {string} the id of the resource
 * @param eventType {string} the event done on the resource
 * @param channelID {string} the id of the channel
 */
function AuditEntry(id, payload, resourceID, eventType, channelID) {
  // always initialize all instance properties
  // eslint-disable-next-line no-underscore-dangle
  this._id = id.toString();
  this.timestamp = new Date().toISOString();
  this.payload = payload;
  this.resourceID = resourceID;
  this.eventType = eventType;
  this.channelID = channelID;
}

// export the class
module.exports.AuditEntry = AuditEntry;
