/**
 * URL: http://pstrinkle.github.io/javascript-modeling
 * Author: Patrick Trinkle <https://github.com/pstrinkle>
 * Version: 1.0.0
 * Copyright 2016 Patrick Trinkle
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(w) {
    w.Util = {
        /**
         * Cleanup the input.  I need to make this something you provide as a
         * caller because I have the same code in two modules, which is poor
         * design.
         */
        cleanup: function(d) {
            /* the following code also appears in my VectorSpace module... */
            var bad = ['.', ',', '?', '!', ':', ';', '(', ')'];
            var escapeRegExp = function(string) {
                return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            };
            var replaceAll = function(string, find, replace) {
                return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
            };

            d += '\n'; /* make sure it always ends with a space. */
            d = replaceAll(d, '\n', ' ');

            /* Also need to remove punctation at the beginning or end of the
             * string.
             */
            for (var i = 0; i < bad.length; i++) {
                d = replaceAll(d, bad[i] + " ", " ");
                d = replaceAll(d, " " + bad[i], " ");
            }

            return d;
        },
    };
})(this);