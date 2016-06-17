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
    "use strict";
    /**
     * Initially a super basic trigram text generative model.
     */
    w.Trigrams = {
        /**
         * Where we store the current model.
         *
         * Super silly and easy.  Likely will come up with a better approach.
         *
         * It is a two-deep object.  Since it needs to be sorted for speedup, I'll
         * likely have that operation occur whenever it learns from a new document.
         */
        trigrams: {},

        addTrigram: function(prev, now, next) {
        	if (this.trigrams[prev] == undefined) {
        		this.trigrams[prev] = {};
        	}
        	
            if (this.trigrams[prev][now] == undefined) {
                this.trigrams[prev][now] = {};
            }

            if (this.trigrams[prev][now][next] == undefined) {
                this.trigrams[prev][now][next] = 0;
            }

            this.trigrams[prev][now][next] += 1;
        },

        cleanup: function(d) {
            return d;
        },

        /**
         * Build a bigram model based on this initial input,
         * you can add more data to the model if you want later.
         */
        init: function(d) {
            d = this.cleanup(d);

            var trigrams = {};
            var terms = d.split(' '); /* could be '' in there. */
            var words = [];

            for (var i = 0; i < terms.length; i++) {
                if (terms[i] === '' || terms[i] === ' ') {
                    continue;
                }

                var l = terms[i].toLowerCase();
                words.push(l);
            }

            if (words.length < 3) {
                throw "Document must have at least two words.";
            }

            /* handle edge case: sentence starts with. */
            this.trigrams('|', words[0], words[1]);

            for (i = 0; i < (words.length-2); i++) {
                var t0 = words[i];
                var t1 = words[i+1];
                var t2 = words[i+2];
                this.addTrigram(t0, t1, t2);
            }

            return;
        },

        /**
         * Given what it knows so far, and providing the current word, return
         * what it thinks will be the next word (the one with the highest probability)
         *
         * ... need to re-examine the posterior probabilities.
         */
        generate: function(prev, curr) {
            if (this.trigrams[prev] == undefined || this.trigrams[prev][curr] == undefined) {
                /* we have no idea..., could rely on part-of-speech, or
                 * ... a few other optiosn.
                 */
                return ".";
            }

            prev = prev.toLowerCase();
            curr = curr.toLowerCase();

            var options = [];
            var available = Object.keys(this.trigrams[prev][curr]);
            for (var i = 0; i < available.length; i++) {
                var t = available[i];
                options.push([t, this.trigrams[prev][curr][t]]);
            }
            var sorted = options.sort(function(a, b) {
                return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
            });

            /* if there are multiple that are the same probability, it should
             * randomly choose one of them, instead of always choosing the top
             * of its list.
             */
            if (sorted.length > 1) {
                /* group the top terms if there are */
                var newtop = [sorted[0][0]];
                var value = sorted[0][1];
                for (var j = 1; j < sorted.length; j++) {
                    if (sorted[j][1] === value) {
                        newtop.push(sorted[j][0]);
                    } else {
                        break; /* we're done. */
                    }
                }

                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
                // Returns a random integer between min (included) and max (excluded)
                var getRandomInt = function(min, max) {
                    return Math.floor(Math.random() * (max - min)) + min;
                }

                var get = getRandomInt(0, newtop.length);
                return newtop[get];
            } else {
                return sorted[0][0];
            }        
        },
    };
})(this);
