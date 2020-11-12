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
