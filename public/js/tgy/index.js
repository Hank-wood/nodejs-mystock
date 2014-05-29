//先初始化需要的bigpipe模块
var bigpipe=new Bigpipe();

//首页的功能
stock.index=(function(){
  //请求时间区间，一般为上午9点到下午3点请求,更新时间
  var hours,now,setTime=10000;
  return{
    //关注数据,请求数据的处理
    ajaxStockTime:function(data){
      for(var i=0,l=data.quotes.length;i<l;i++){
        data.quotes[i].volume=(data.quotes[i].volume/10000).toFixed(2);
        data.quotes[i].marketCapital=(data.quotes[i].marketCapital/100000000).toFixed(2);
        if(Number(data.quotes[i].change)>0){
          data.quotes[i].zdClass="red";
          data.quotes[i].zdBack="danger";
          data.quotes[i].change="+"+data.quotes[i].change;
          data.quotes[i].percentage="+"+data.quotes[i].percentage+"%";
        }else if(Number(data.quotes[i].change)===0){
          data.quotes[i].zdClass="";
          data.quotes[i].zdBack="";
          data.quotes[i].percentage=data.quotes[i].percentage+"%";
        }else{
          data.quotes[i].zdClass="green";
          data.quotes[i].zdBack="success";
          data.quotes[i].percentage=data.quotes[i].percentage+"%";
        }
      }
      return data;
    },
    //定时更新股票数据
    startGetStock:function(callback){
      var _this=this;
      now = new Date();
      hours = now.getHours();
      if(hours>9&&hours<20){
        callback();
        setTimeout(function(){
          _this.startGetStock(callback);
        },setTime);
      }
    },
    //热门股
    hotStockData:function(data){
      for(var k=0,l3=data.list.length;k<l3;k++){
        data.list[k].haveWatch=true;
        data.list[k].num=k;
      }
      var userWatchList=$("#stockList").attr("my-stock").split(",");
      for(var i=0,l=userWatchList.length;i<l;i++){
        for(var j=0,l2=data.list.length;j<l2;j++){
          if(userWatchList[i]==data.list[j].uid){
            data.list[j].haveWatch=false;
          }
        }
      }
      return data;
    },
    //处理热门用户数据
    hotPeopleData:function(data){
      for(var i=0,l=data.list.length;i<l;i++){
        data.list[i].num=i;
      }
      return data;
    },
    //关注热门人物数据
    watchTopPeopleData:function(topPeopleList,num){
      var newArrayTop=[];
      for(var i=0,l=topPeopleList.length;i<l;i++){
        newArrayTop.push({
          num:topPeopleList[i].num,
          name:topPeopleList[i].name,
          top:topPeopleList[i].top,
          isWatch:topPeopleList[i].isWatch
        });
      }
      newArrayTop[num].isWatch=true;
      newArrayTop[num].top++;
      return newArrayTop;
    },
    //删除股票，实时数据状态更新
    delStockTime:function(data,name){
      newlist=[];
      for(var i=0,l=data.length;i<l;i++){
        if(data[i].name!=name){
          newlist.push(data[i]);
        }
      }
      return newlist;
    },
    //删除股票，股票定时请求列表更新
    delStockList:function(delStockUid){
      timeStock=$("#stockList").attr("my-stock").split(",");
      var newTimeStock=[];
      for(var i2=0,l2=timeStock.length;i2<l2;i2++){
        if(timeStock[i2]==delStockUid){
        }else{
          newTimeStock.push(timeStock[i2]);
        }
      }
      timeStock=newTimeStock.join(",");
      $("#stockList").attr("my-stock",timeStock);
    },
    //热门股票处理,可能会有热门股票中包含已删除股票的内容
    delStockInTop:function(delStockUid,topList,callback){
      for(var h=0,l5=topList.length;h<l5;h++){
        if(delStockUid==topList[h].uid){
          topList[h].haveWatch=true;
          topList[h].top--;
          newArrtop=[];
          for(var h2=0,l6=topList.length;h2<l6;h2++){
            newArrtop.push({
              uid:topList[h2].uid,
              name:topList[h2].name,
              top:topList[h2].top,
              haveWatch:topList[h2].haveWatch,
              num:topList[h2].num
            });
          }
          //$scope.topList=newArrtop;
          callback(newArrtop);
          return;
        }
      }
    },
    //关注热门股票，刷新热门列表
    addTopWatchList:function(topList,list){
      var newTopList=[];
      for(var m=0,l3=topList.length;m<l3;m++){
        newTopList[m]={
          haveWatch:topList[m].haveWatch,
          name:topList[m].name,
          top:topList[m].top,
          uid:topList[m].uid,
          num:topList[m].num
        };
      }
      newTopList[list.num].haveWatch=topList[list.num].haveWatch=false;
      //关注数增加1
      newTopList[list.num].top++;
      topList[list.num].top++;
      return newTopList;
    },
    //关注股票，股票定时请求列表更新
    addStockList:function(topStockUid){
      var newMyStock=$("#stockList").attr("my-stock")+","+topStockUid;
      $("#stockList").attr("my-stock",newMyStock);
    }
  }
})();



//IndexCtrl函数在页面加载完毕后执行
function IndexCtrl($scope, $http, $templateCache) {
  var myName=$("#headShowName").text(),
      //定时刷新列表
      timeStock=[],
      //关注列表
      //watchList=[],
      //热门列表
      //topList=[],
      //清洗热门列表
      newTopList=[],
      //新关注数据
      //newMyStock,
      //删除我的关注列表
      newlist=[],
      //定时请求的列表
      stockCode,
      //删除的股票uid和url
      delStockUid,
      delWatchUrl,
      //关注一个热门uid和url
      topStockUid,
      topWatchUrl,
      //为了解决删除自选股，增加热门关注效果的ng-show问题
      newArrtop=[];

  //从雪球跨域获取关注股票的各种数据
  function ajaxStock(){
    stockCode=$("#stockList").attr("my-stock");
    if(stockCode!==""){//如果没有信息，就不请求
      //$scope.url = 'http://xueqiu.com/stock/quote.json?code='+stockCode+'&'+xueqiuUrl+'&callback=JSON_CALLBACK';
      $scope.url = 'http://xueqiu.com/stock/quote.json?code='+stockCode+'&callback=JSON_CALLBACK';
      $http({method: 'JSONP', url: $scope.url, cache: $templateCache}).success(function(data, status) {
        data=stock.index.ajaxStockTime(data);
        // $scope.stocks=watchList=data.quotes;
        $scope.stocks=data.quotes;
      });
    }
  }

  ajaxStock();
  //定时更新股票数据
  stock.index.startGetStock(ajaxStock);

  /*
  *bigpipe-方式请求热门股
  */
  bigpipe.ready('hotStock',function(data){
    if(data.ok){
      data=stock.index.hotStockData(data);
      //这里使用$apply()触发下更新，防止接口返回太慢导致不更新
      //第二种写法
      $scope.$apply(function(){
        $scope.topList=data.list;
      });
    }
  });

  /*
  *bigpipe方法请求热门用户，为了看效果，故意设置了延迟
  */
  bigpipe.ready('hotPeople',function(data){
    if(data.ok){
      data=stock.index.hotPeopleData(data);
      $scope.peoples=data.list;
      //这里使用$apply()触发下更新，防止接口返回太慢导致不更新
      $scope.$apply();
    }
  });

  //关注热门人物
  $scope.topPeople=function(people){
    var name=people.name;
    var num=people.num;
    if($("#headShowName").text()==name){
      alert("不能关注自己");
    }else{
      $http({method: "GET", url: "/watchPeople?name="+name, cache: $templateCache}).success(function(data,status){
        if(data.ok){
          $scope.peoples=stock.index.watchTopPeopleData($scope.peoples,num);
        }
      });
    }
  };

  //删除关注的股票
  $scope.delStock = function(Stock) {
    delStockUid=Stock.symbol.toLowerCase();
    delWatchUrl="watchStock?uid="+delStockUid+"&name="+Stock.name+"&beWatchName="+$("#headShowName").text()+"&beWatchTop="+$("#headShowName").attr("top")+"&add=0";
    $http({method: "GET", url: delWatchUrl, cache: $templateCache}).success(function(data, status) {
      if(data.ok){
        //删除后，实时股票数据代码更新
        $scope.stocks=stock.index.delStockTime($scope.stocks,Stock.name);
        //在$("#stockList").attr("my-stock") 中减少删除数据,减少定时关注数据
        stock.index.delStockList(delStockUid);
        //热门股票处理,可能会有热门股票中包含已删除股票的内容
        stock.index.delStockInTop(delStockUid,$scope.topList,function(newArrtop){
          $scope.topList=newArrtop;
        });
      }else{
        alert("出错了");
      }
    });
  };

  //关注一个热门股票，会显示到及时更新数据中
  $scope.topWatch=function(list){
    topStockUid=list.uid.toLowerCase();
    topWatchUrl="watchStock?uid="+topStockUid+"&name="+list.name+"&beWatchName="+$("#headShowName").text()+"&beWatchTop="+$("#headShowName").attr("top")+"&add=1";
    $http({method: "GET", url: topWatchUrl, cache: $templateCache}).success(function(data, status) {
      if(data.ok){
        //刷新热门列表
        $scope.topList=stock.index.addTopWatchList($scope.topList,list);

        //跨域刷新我关注的股票的数据
        //$scope.addUrl = 'http://xueqiu.com/stock/quote.json?code='+topStockUid+'&'+xueqiuUrl+'&callback=JSON_CALLBACK';
        $scope.addUrl = 'http://xueqiu.com/stock/quote.json?code='+topStockUid+'&callback=JSON_CALLBACK';
        $http({method: 'JSONP', url: $scope.addUrl, cache: $templateCache}).success(function(data, status) {
          //处理请求关注的数据
          data=stock.index.ajaxStockTime(data);

          if($scope.stocks){
            $scope.stocks.push(data.quotes[0]);
          }else{
            $scope.stocks=[];
            $scope.stocks.push(data.quotes[0]);
          }
          
          //在定时获取股票数据列表中增加更新,增加定时关注数据
          stock.index.addStockList(topStockUid)
        });
      }else{
        alert("出错了");
      }
    });
  };

  //搜索股票
  $scope.search=function(){
    var searchUid=$("#stockUid").val();
    if(/^sh[0-9]{6}$|^sz[0-9]{6}$/i.test(searchUid)){//这里只识别sh或sz开头的股票
      location.href="stock/"+searchUid;
    }else{
      alert("请填写正确的代码,这里只是举开头以sh/sz为例");
    }
  };
  
  /************自定义搜索**start**************/
  var over;
  //搜索框代码提示
  $scope.hint = function(){
	 var searchUid = $("#stockUid");
     var searchHint = $("#searchHint");
     var commonPara = '&size=9&key=47bce5c74f&access_token=9fpzmQ1RtczZ5yPQ3zDa7T&_=1400569590433';
     var hintUrl = 'http://xueqiu.com/stock/search.json?code='+searchUid.val() +'&callback=JSON_CALLBACK';
     $http({method: "JSONP", url: hintUrl}).success(function(data, status) {
         //for(var i=0,l=data.stocks.length;i<l;i++){
        	  //alert("code: " + data.stocks[0].code + "---name: " + data.stocks[0].name);
          //}
          $scope.hints = data.stocks;
     });
  }
  //搜索框失去焦点
  $scope.blur = function(){
      if(over){
    	  $scope.hints = '';
      }
  }

  $scope.ngclick = function(target){
	  var stockUid = $("#stockUid");
	  stockUid[0].value = target.getAttribute('data');
  }
  $scope.ngMouseover = function(){
	  over = false;
  } 
  $scope.ngMouseleave = function(){
	  over = true;
	  $scope.hints = '';
  }  
	
 /************自定义搜索**end**************/
  

  //提交话题
  $scope.submitCom=function(){
    if(!$scope.sayCom){
      alert("请填写内容");
    }else{
      var commentObj=stock.textExtract($scope.sayCom,myName);
      $http.post("/submitTopic", commentObj).success(function(data,status){
        if(data.isOk){
          $scope.sayCom="";
          if(!!$scope.myTopicList){//已经加载了我的评论页面
            //插入到第一个
            $scope.myTopicList.unshift(data.data[0]);
          }
        }else{
          alert("提交失败!");
        }
      });
    }
  };

  /*
  我的话题模块
  */
  //初始化stock.angular函数，传入这个作用域内需要用到的函数
  var selfName=myName;//selfName登陆用户
  var openMyTopic=true;
  var angular=stock.angular($http,$scope,myName,selfName);
  //自定义加载内容
  angular.getMyTopic=function(url,name,pageSize,pageNum,event){
    $http({method: "GET", url: "/"+url+"?name="+name+"&pageNum="+pageNum+"&pageSize="+pageSize}).success(function(data,status){
      if(data.isOk){
        openMyTopic=false;
        //处理分页
        if(event){
          event.attr("num",pageNum/10+1);
        }
        if(pageNum===0){
          $scope.myTopicList=data.data;
        }else{
          $scope.myTopicList=$scope.myTopicList.concat(data.data);
        }
        
        //超过10条显示加载跟多
        if(data.data.length==10){
          $scope.myTopicGetmore=true;
        }else{
          $scope.myTopicGetmore=false;
        }
      }else{
        alert("获取失败");
      }
    });
  };
  //有差异处理的ng-click
  angular.clickNg=function(){
    var _this=this;
    //初始化我的话题
    $scope.myTopic=function(){
      if(openMyTopic){
        _this.getMyTopic("myTopic",myName,10,0);
      }
    };
    //提交话题评论-回调有差异
    $scope.submitCommentTopic=function(e,myTopic){
      _this.subComTop(e,myTopic,function(data){
        //展示刚刚转发内容
        if(myName==selfName){
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //提交回复评论-回调有差异
    $scope.commentRe=function(comment,myTopic){
      _this.comRe(comment,myTopic,function(data){
        //展示刚刚转发内容
        if(myName==selfName){
          $scope.myTopicList.unshift(data);
        }
      });
    };
    //加载更多-有差异
    $scope.getTopicMore=function(e){
      var num=Number($(e.target).attr("num"));
      _this.getMyTopic("myTopic",myName,10,num*10,$(e.target));
    };
  };
  //初始化我的话题
  angular.init();
  
  /*
  我关注的用户话题模块
  */
  var adoutTopic=stock.angular($http,$scope,myName,selfName);
  adoutTopic.getAboutTopic=function(url,name,pageSize,pageNum,event){
    $http({method: "GET", url: "/"+url+"?name="+name+"&pageNum="+pageNum+"&pageSize="+pageSize}).success(function(data,status){
      if(data.isOk){
        //openMyTopic=false; 
        //处理分页
        if(event){
          event.attr("num",pageNum/10+1);
        }
        
        if(pageNum===0){
          $scope.aboutTopicList=data.data;
        }else{
          $scope.aboutTopicList=$scope.aboutTopicList.concat(data.data);
        }
        
        //超过10条显示加载跟多
        if(data.data.length==10){
          $scope.aboutTopicGetmore=true;
        }else{
          $scope.aboutTopicGetmore=false;
        }
      }else{
        alert("获取失败");
      }
    });
  };
  adoutTopic.clickNg=function(){
    var _this=this;
    this.getAboutTopic("aboutTopic",myName,10,0);
    //提交话题评论
    $scope.submitComAboutTopic=function(e,myTopic){
      _this.subComTop(e,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //提交回复评论
    $scope.comAboutRe=function(comment,myTopic){
      _this.comRe(comment,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };
    //加载更多
    $scope.getAboutMore=function(e){
      var num=Number($(e.target).attr("num"));
      _this.getAboutTopic("aboutTopic",myName,10,num*10,$(e.target));
    };
  };
  //初始化
  adoutTopic.init();

  /*
  我关注的股票话题模块
  */
  var openAboutStockTopic=true;
  var adoutStockTopic=stock.angular($http,$scope,myName,selfName);
  adoutStockTopic.getAboutStockTopic=function(name,pageSize,pageNum,event){
    $http({method: "GET", url: "/aboutStockTopic?name="+name+"&pageNum="+pageNum+"&pageSize="+pageSize}).
      success(function(data,status){
        if(data.isOk){
          openAboutStockTopic=false; 
          //处理分页
          if(event){
            event.attr("num",pageNum/10+1);
          }
          
          if(pageNum===0){
            $scope.aboutStockTopicList=data.data;
          }else{
            $scope.aboutStockTopicList=$scope.aboutStockTopicList.concat(data.data);
          }
          
          //超过10条显示加载跟多
          if(data.data.length==10){
            $scope.aboutStockTopicMore=true;
          }else{
            $scope.aboutStockTopicMore=false;
          }
        }else{
          alert("获取失败");
        }
      });
  };
  adoutStockTopic.clickNg=function(){
    var _this=this;
    //点击初始化
    $scope.aboutStockTopic=function(){
      if(openAboutStockTopic){
        _this.getAboutStockTopic(myName,10,0);
      }
    };
    //提交话题评论
    $scope.submitComAboutStockTopic=function(e,myTopic){
      _this.subComTop(e,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //提交回复评论
    $scope.comAboutStockRe=function(comment,myTopic){
      _this.comRe(comment,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //加载更多
    $scope.getStockTopicMore=function(e){
      var num=Number($(e.target).attr("num"));
      _this.getAboutStockTopic(myName,10,num*10,$(e.target));
    };
  };
  //初始化
  adoutStockTopic.init();

  /*
  @我话题模块
  */
  var openAtmeTopic=true;
  var atmeTopic=stock.angular($http,$scope,myName,selfName);
  atmeTopic.getAtmeTopic=function(name,pageSize,pageNum,event){
    $http({method: "GET", url: "/atmeTopic?name="+name+"&pageNum="+pageNum+"&pageSize="+pageSize}).
      success(function(data,status){
        if(data.isOk){
          openAtmeTopic=false; 
          //处理分页
          if(event){
            event.attr("num",pageNum/10+1);
          }
          
          if(pageNum===0){
            $scope.atmeTopicList=data.data;
          }else{
            $scope.atmeTopicList=$scope.atmeTopicList.concat(data.data);
          }
          
          //超过10条显示加载跟多
          if(data.data.length==10){
            $scope.atmeTopicMore=true;
          }else{
            $scope.atmeTopicMore=false;
          }
        }else{
          alert("获取失败");
        }
      });
  };
  atmeTopic.clickNg=function(){
    var _this=this;
    //点击初始化
    $scope.atTopic=function(){
      if(openAtmeTopic){
        _this.getAtmeTopic(myName,10,0);
      }
    };
    //提交话题评论
    $scope.submitComAtmeTopic=function(e,myTopic){
      _this.subComTop(e,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //提交回复评论
    $scope.comAtmeRe=function(comment,myTopic){
      _this.comRe(comment,myTopic,function(data){
        if(!!$scope.myTopicList){
          //在我的话题栏目展示刚刚转发内容
          $scope.myTopicList.unshift(data);
        }
      });
    };

    //加载更多
    $scope.getStockTopicMore=function(e){
      var num=Number($(e.target).attr("num"));
      _this.getAtmeTopic(myName,10,num*10,$(e.target));
    };
  };
  atmeTopic.init();
}

//angular.module('App', []);
angular.bootstrap(document.documentElement);

  /*
  *angularjs 内部的ajax方式请求热门股
  */
  // $http({method: "GET", url: "/hotStock", cache: $templateCache}).
  //   success(function(data,status){
  //     if(data.ok){
  //       for(var k=0,l3=data.list.length;k<l3;k++){
  //         data.list[k].haveWatch=true;
  //         data.list[k].num=k;
  //       }
  //       var userWatchList=$("#stockList").attr("my-stock").split(",");
  //       for(var i=0,l=userWatchList.length;i<l;i++){
  //         for(var j=0,l2=data.list.length;j<l2;j++){
  //           if(userWatchList[i]==data.list[j].uid){
  //             data.list[j].haveWatch=false;
  //           }
  //         }
  //       }
  //       $scope.topList=topList=data.list;
  //     }
  //   });


  //请求热门用户
  //由于后端同时请求了热门股票，会导致mongodb同时开启导致bug，暂时注释
  // var topPeopleList;
  // $http({method: "GET", url: "/hotPeople", cache: $templateCache}).
  //   success(function(data,status){
  //     if(data.ok){
  //       for(var i=0,l=data.list.length;i<l;i++){
  //         data.list[i].num=i;
  //       }
  //       $scope.peoples=topPeopleList=data.list;
  //     }
  //   });