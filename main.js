;(async function() {
  let saveData = JSON.parse(localStorage.getItem('saveData')) || [{}]
  let saveDataObj = {}
  if (!Array.isArray(saveData)) {
    let oldSaveData = saveData
    saveData = []
    saveData.push(oldSaveData)
  }

  let getValueByKey = function(obj, key) {
    return obj.hasOwnProperty(key) ? obj[key] : []
  }
  let setSaveData = function(key, value, has, player) {
    saveDataObj = saveData[player]
    let dataArray = getValueByKey(saveDataObj, key)
    let index = dataArray.indexOf(value)
    if (index < 0) {
      if (has) dataArray.push(value)
    } else {
      if (!has) dataArray.splice(index, 1)
    }
    saveDataObj[key] = dataArray
    saveData[player] = saveDataObj
    window.localStorage.setItem('saveData', JSON.stringify(saveData))
  }

  let items = await axios
    .get('./assets/data.json')
    .then(res => res.data)
    .catch(() => [])

  let group = await axios
    .get('./assets/group.json')
    .then(res => res.data)
    .catch(() => [])

  new Vue({
    el: '#app',
    data: {
      items,
      group,
      index: {
        typeIndex: null,
        btnIndex: 0,
        playIndex: 0,
        groupIndex: 0
      },
      checkboxData: {},
      filterString: ''
    },
    computed: {
      typeList() {
        return this.items.map(item => item.name)
      },
      typeIndexSelect: {
        get() {
          return this.index.typeIndex
        },
        set(index) {
          this.index.groupIndex = 0
          this.index.typeIndex = index
        }
      },
      groupList() {
        let groupList = { 0: '全部' }
        let index = this.typeIndexSelect
        let groups = {}
        if (index === 5) {
          groups = this.group['diyGroup']
        }
        if (index === 6) {
          groups = this.group['homeGroup']
        }
        for (let groupKey in groups) {
          groupList[groupKey] = groups[groupKey]
        }
        return groupList
      },
      groupIndexSelect: {
        get() {
          return this.index.groupIndex
        },
        set(index) {
          this.index.groupIndex = parseInt(index)
        }
      },
      typeId() {
        let index = this.typeIndexSelect
        return index === null ? '' : this.items[index].id
      },
      btnValues() {
        let btnValues = ['全部', '已捐贈', '未捐贈']
        let index = this.typeIndexSelect
        if (index !== null) {
          let hasName = this.items[index].hasName
          btnValues[1] = `已${hasName}`
          btnValues[2] = `未${hasName}`
        }
        return btnValues
      },
      itemList() {
        let index = this.typeIndexSelect
        let data = index === null ? null : this.items[index].data
        return data
      },
      groupFilterList() {
        let groupIndex = this.index.groupIndex
        let list = this.itemList
        return groupIndex === 0
          ? list
          : list.filter(item => item.group && item.group === groupIndex)
      },
      filterList() {
        let filter = this.filterString
        let list = this.groupFilterList
        return filter
          ? list.filter(item => item.name.indexOf(filter) >= 0)
          : list
      },
      showList() {
        let list = this.filterList
        let index = this.index.btnIndex
        if (list !== null && index !== 0) {
          list = list.filter(
            item => (index === 1) === this.getCheckValue(item.key)
          )
        }
        return list
      },
      showUserList() {
        let list = this.showList
        if (list !== null) {
          list.map(item => {
            this.itemNameFilter(item)
            this.itemUtlFilter(item)
            return item
          })
        }
        return list
      }
    },
    methods: {
      changeBtn(index) {
        this.index.btnIndex = index
      },
      getCheckValue(key) {
        return this.checkboxData[this.typeId][key]
      },
      clickCheck(key) {
        let value = this.checkboxData[this.typeId][key]
        let has = !value
        this.checkboxData[this.typeId][key] = has
        let keys = this.typeIndexSelect
        let player = this.index.playIndex
        setSaveData(keys, key, has, player)
      },
      itemNameFilter(item) {
        let info = ''
        if (item.price) {
          info = `($ ${item.price})`
        }
        if (item.hasfake && item.hasfake === 'Y') {
          info = '(有贗品)'
        }
        item.showName = item.name + info
      },
      itemUtlFilter(item) {
        if (item.urlvalue) {
          item.url = `https://animalcrossing.fandom.com/wiki/${item.urlvalue}`
          item.urlshow = true
        } else {
          item.urlshow = false
        }
      }
    },
    mounted() {
      this.items.reduce((checkData, now, index) => {
        let userData = getValueByKey(saveData[0], index)
        let dataHas = {}
        let data = now.data
        data.forEach(item => {
          let key = item.key
          let has = userData.indexOf(key) >= 0
          dataHas[key] = has
        })
        let id = now.id
        this.$set(this.checkboxData, id, dataHas)
      }, {})
    }
  })
})()
