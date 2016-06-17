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
         * 
         * merge := if true, it makes into one long sentence, otherwise it keeps
         * some sense of sentence separation.
         */
        cleanup: function(d, merge = true) {
            var escapeRegExp = function(string) {
                return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            };
            var replaceAll = function(string, find, replace) {
                return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
            };

            d += '\n'; /* make sure it always ends with a space. */
            d = replaceAll(d, '\n', ' ');

            var whitespace = ['\t', ' '];

            for (var i = 0; i < whitespace.length; i++) {
            	d = d.replace(new RegExp('[' + escapeRegExp(whitespace[i]) + ']+', 'g'), whitespace[i]);
            }

            /* Also need to remove punctation at the beginning or end of the
             * string.
             */
            var bad = [',', ':', ';', '(', ')', '{', '}', '\n', '[', ']',
                       '`', '~', '@', '#', '$', '%', '^', '&', '*', '\\', '|',
                       '<', '>', '/', '"', '_', '-', '+', '='];

            /* convert !!! => ! */
            for (var i = 0; i < bad.length; i++) {
            	d = d.replace(new RegExp('[' + escapeRegExp(bad[i]) + ']+', 'g'), bad[i]);
            }

            /* convert ", " => " " */
            for (i = 0; i < bad.length; i++) {
                d = replaceAll(d, bad[i] + " ", " ");
                d = replaceAll(d, " " + bad[i], " ");
            }

            /* now cleanup any bizarre straggler cases. */
            for (i = 0; i < bad.length; i++) {
            	d = replaceAll(d, bad[i], "");
            }

            /* we always add a trailing ' ' to help with:
             * What about bob. => What about bob . 
             * Where are you? => Where are you . 
             * I'm here! => I'm here . 
             * 
             * Then we split on " . "
             */
            var seps = ['.', '?', '!'];

            for (i = 0; i < seps.length; i++) {
            	d = d.replace(new RegExp('[' + escapeRegExp(seps[i]) + ']+', 'g'), seps[i]);
            }

            for (i = 0; i < seps.length; i++) {
                d = replaceAll(d, seps[i] + ' ', " . ");
            }

            if (merge) {
            	d = replaceAll(d, " . ", " ");
            }

            return d;
        },
    };
})(this);