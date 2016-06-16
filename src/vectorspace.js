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
    /**
     * Allows building a VectorSpace model of documents provided...
     *
     * The initial goal was to make just a basic representation entirely on the
     * client, however it serves no real purpose.  I was thinking of a couple fun
     * ideas:
     * 
     * 1) You provide it with emails you've written and it attempts predictive
     * test via a bigrams options.
     *
     * 2) You provide it with a series of documents and it becomes a search engine,
     * but could also tell you from the submitted documents which terms are the 
     * most frequent and which are the most descriptive about a given piece of text,
     * which does have some value.
     */
    w.VectorSpace = {
        /**************************************************************************/
        /**
         * An object of objects, each has 'tf', 'data' where data is the 
         * tf-idf representation for the terms in the document...
         *
         * corpus[name].tf, corpus[name].data
         */
        corpus: {},

        /**
         * The number of documents in which this word appears.
         * 
         * documentFreqs[term] = cnt
         */
        documentFreqs: {},

        /**
         * Add document to the corpus.
         *
         * It adds the document to the corpus and then triggers a document
         * update.
         */
        addDocument: function(name, d) {
            var vec = this.process(d);
            var nterms = Object.keys(vec);
            /* this step could go into process, it'd just need another
             * parameter to determine if it should or not.
             */
            for (var i = 0; i < nterms.length; i++) {
                if (documentFreqs[nterms[i]] == undefined) {
                    documentFreqs[nterms[i]] = 0;
                }

                documentFreqs[nterms[i]] += 0;
            }

            var entry = {
                tf: vec,
                data: {}, /* this will be built during the update */
            };

            if (corpus[name] != undefined) {
                throw "Document already exists";
            }

            corpus[name] = entry;

            this.updateValues();

            return;
        },
        
        /**
         * We have reason to believe our tf-idf values are no longer accurate, 
         * so we need to update them.  Well, the idf portion.
         */
        updateValues: function() {
            var documents = Object.keys(corpus);

            for (var i = 0; i < documents.length; i++) {
                var doc = corpus[documents[i]];
                var terms = Object.keys(doc.tf);
                for (var j = 0; j < terms.length; j++) {
                    var t = terms[j];
                    var idf = Math.log10(1 + documents.length / documentFreqs[t]);
                    /* store the result. */
                    doc.data[t] = doc.tf[t] * idf;
                }
            }

            return;
        },

        /**************************************************************************/

        /**
         * stop words are words that are ignored in typical analysis.  However,
         * there is value in both the frequencies and positions of stop words in
         * different analyses... so the idea is to focus on one approach first.
         *
         * stored as dictionary for quicker lookup and testing that is cross-browser
         * "in" not necessarily implemented evenly.
         */
        stopwords: {},

        /**
         * receives a string that is a newline separated list of words.
         */
        importStopwords: function(words) {
            var nwords = this.process(words, false);
            var nobj = Object.keys(nwords);
            for (var i = 0; i < nobj.length; i++) {
                if (this.stopwords[nobj[i]] == undefined) {
                    this.stopwords[nobj[i]] = 1;
                }
            }

            return;
        },

        /**
         * Given two term weight dictionaries "vectors" compute the cosine 
         * similarity.
         */
        cosineSimilarity: function(d1, d2) {
            var dotProduct = 0.0, a_sqrs = 0.0, b_sqrs = 0.0;
            var a_words = Object.keys(d1);
            var b_words = Object.keys(d2);

            for (var i = 0; i < a_words.length; i++) {
                var t = a_words[i];
                a_sqrs += (d1[t] * d1[t]);

                if (d2[t] != undefined) {
                    dotProduct += d1[t] * d2[t]
                }
            }
            
            for (i = 0; i < b_words.length; i++) {
                var t = b_words[i];
                b_sqrs += (d2[t] * d2[t]);
            }
            
            var a_sqrt = Math.sqrt(a_sqrs);
            var b_sqrt = Math.sqrt(b_sqrs);

            return (dotProduct / (a_sqrt * b_sqrt))
        },

        cleanup: function(d) {
            /* the following code also appears in my VectorSpace module... */
            var bad = ['.', ',', '?', '!', ':', ';', '(', ')'];
            var escapeRegExp = function(string) {
                return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            };
            var replaceAll = function(string, find, replace) {
                return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
            };

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

        /**
         * Given a string, it splits it into words and returns a term weight
         * dictionary, such that term weight is 0.5 + (0.5 * tw/max)
         *
         * It doesn't normalize anything yet based on the document length.
         *
         * d := the string
         * stop := boolean whether to care about stopwords.
         */
        process: function(d, stop = true) {
        	d = this.cleanup(d);

            /* probably does leave some words that are ' ' */
            var words = d.split(' ');
            var vector = {};
            var total = 0;

            for (i = 0; i < words.length; i++) {
                if (words[i] === '' || words[i] === ' ') {
                     continue;
                }

                var l = words[i].toLowerCase();

                /* if we care about stop words, and it's not undefined, skip */
                if (stop && this.stopwords[l] != undefined) {
                    continue;
                }

                if (vector[l] === undefined) {
                    vector[l] = 0;
                }

                vector[l] += 1;
                total += 1;
            }

            var max = 0.0;
            var s = Object.keys(vector);

            /* it might make sense to return [(t, w), (t, w), ...]. */
            for (i = 0; i < s.length; i++) {
                if (vector[s[i]] > max) {
                    max = vector[s[i]];
                }
            }

            /* by using max, if a string is two words, the term weights are
             * both 1.  which I don't know.  I feel like they should add up
             * to 100, making them more of a term weight versus a normalized
             * term frequency.  normalized in the sense that every term was
             * reduced by the maximum count setting the maximum count to 1.
             *
             * 
             */
            for (i = 0; i < s.length; i++) {
                var c = vector[s[i]];
                vector[s[i]] = 0.5 + (0.5 * (c / max));
            }

            return vector;
        }
    };
})(this);
