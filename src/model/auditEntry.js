/*
 * Copyright 2020 Unisys Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
