(function($) {

    $.fn.pSelect = function(params) {
        console.time('lay');
        console.log(this);
        var options = $.extend({
            //override defaults (lowest order)
            placeholder:$(this).attr('placeholder')
        },$.fn.pSelect.defaults,params);

        //bury select box
        $(this).hide();
        var $select = $(this);

        //create new pSelect container
        var $pSelect = $("<div>", {class: "pSelect"});
        $pSelect.insertAfter(this)
        $pSelect.css({
            'font-size':    options.baseSize,
            'text-align':   options.align
        });

        //pSelect fake representation markup
        var $pS_box = $("<div>",{class: "pSelect-box"}).text(options.placeholder);
        $pS_box.appendTo($pSelect)


        //create dropdown: lay options | put searchbox
        var wrapper = document.createElement('div');
        wrapper.className = 'pSelect-wrapper';
        if(options.search.enable) {
            var search = document.createElement('input');
            search.type='text';
            search.placeholder = options.search.placeholder;
            var searchBox = document.createElement('div');
            searchBox.classList.add('search-box');
            searchBox.appendChild(search);
            wrapper.appendChild(searchBox);
        }

        var wrapperUL = document.createElement('ul');
        $(this).find('option').each(function(i,item) {
            var option = document.createElement('li');
            option.textContent  = item.textContent;
            //option.value        = item.value;
            var attr = document.createAttribute('data-value');
            attr.value = item.value;
            option.setAttributeNode(attr);
            wrapperUL.appendChild(option);
        });
        wrapper.appendChild(wrapperUL);
        $pSelect[0].appendChild(wrapper);



        //toggle list
        $(document).on('click','.pSelect',antiDoubleClick(function(e) {
            if(e.target !== search) {
                $(this).find('.pSelect-wrapper').toggleClass('open');
                $('body').toggleClass('pSelect-is-open');
                if($('body').hasClass('pSelect-is-open')) {
                    try {
                        console.log(search.focus());
                    } catch(e) {console.log(e)}


                }
            }
        },300));

        //bind keyboard
        $(document).on('keydown','.pSelect-is-open',function(e) {
            var code;
            if (e.key !== undefined) {
                code = e.key;
            } else if (e.keyIdentifier !== undefined) {
                code = e.keyIdentifier;
            } else if (e.keyCode !== undefined) {
                code = e.keyCode;
            }
            switch(code) {
                case 40:
                    e.preventDefault();
                    var selected = $pSelect.find('li.pS-active');
                    if(selected.length) {
                        selected.removeClass('pS-active').next(':not(.hide)').addClass('pS-active');
                    } else {
                        debugger;
                        $pSelect.find('li:eq(0):not(.hide)').addClass('pS-active');
                    }
                    break;
                case 38:
                    e.preventDefault();
                    var selected = $pSelect.find('li.pS-active');
                    if(selected.length) {
                        selected.removeClass('pS-active').prev(':not(.hide)').addClass('pS-active');
                    } else {
                        $pSelect.find('li:last:not(.hide)').addClass('pS-active');
                    }
                    break;
                case 13:
                    e.preventDefault();
                    $pSelect.find('li.pS-active').click();
                    break;
                default:

                    break;
            }
        });

        //select item
        $(document).on('click','.pSelect-wrapper li',function(e) {
            if(e.target !== searchBox && e.target !== search) {
                select($(this));
            }
        });
        function select($element) {
            $select.val($element.attr('data-value')).trigger('change');
            $pS_box.text($element.text());
        }

        //search
        //bind search
        if(options.search.enable) {
            search.addEventListener('input',function() {
                filterOptions('.pSelect-wrapper li',search.value);
            });
        }

        //ajax search
        if(options.ajax.url) {
            $.get(options.ajax.url,function() {

            });
        }



        // var searchTime = {
        //     t0: 0,
        //     t1: 0,
        //     diffs: [],
        //     avg:0
        // };
        function filterOptions(selector, term) {
            // searchTime.t0 = window.performance.now();

            var nodes = document.querySelectorAll(selector);
            for(var i=0;i<nodes.length;i++) {
                if(!~nodes[i].textContent.search(new RegExp(term,'gi'))) {
                    nodes[i].classList.add('hide');
                } else {
                    nodes[i].classList.remove('hide');
                }
            }
            // searchTime.t1 = window.performance.now();
            // debugger;
            // if(searchTime.diffs.length<=10) {
            //     searchTime.diffs.push(searchTime.t1 - searchTime.t0);
            // } else {
            //     searchTime.avg = searchTime.diffs.reduce(function(a,b){return a+b;}).log() / searchTime.diffs.length
            //     console.log(searchTime.avg);
            //     searchTime.diffs =[];
            // }

        }



        function antiDoubleClick (fn, delay) {
            var timeoutID = null;
            var running = false;
            return function () {
                clearTimeout(timeoutID);
                var args = arguments;
                var that = this;
                !running && fn.apply(that, args);
                running = true;

                timeoutID = setTimeout(function () {
                    running = false;
                }, delay);
            }
        }

        console.timeEnd('lay');

    };
    $.fn.pSelect.defaults = {
        baseSize: 14,
        align: 'center',
        search: {
            enable: true,
            placeholder:'Enter 3 characters at least'
        },
        ajax: {
            url: false
        }
    }
})(jQuery);

