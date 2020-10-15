class Puzzle {
  constructor() {
    this.$el = document.getElementById('puzzle');
    this.$slider = document.getElementById('slider');
    this.imageUrl = 'http://cs.pikabu.ru/images/jobseeker/logo2.png';

    const width = this.$el.parentNode.clientWidth;
    this.$el.style.width = width;
    this.$el.style.height = width;

    this.$el.addEventListener('click', event => {
      const x = +event.target.dataset.x;
      const y = +event.target.dataset.y;
      const index = +event.target.dataset.index;

      this.checkAction({ x, y }, index);
    });

    this.$slider.addEventListener('input', (event) => {
      this.changeSize(event.target.valueAsNumber);
    });

    this.$slider.addEventListener('mouseup', (event) => {
      this.redraw();
    });

    this.$slider.addEventListener('touchend', (event) => {
      this.redraw();
    });

    window.addEventListener('resize', this.resize);
  }

  /**
   * Создать новое поле и перемешать
   */
  create() {
    this.nullPos = { x: 0, y: 0 };
    this.draw(this.$slider.valueAsNumber);
    this.shuffle();
  }

  /**
   * Отрисовка первичного состояния
   * @param {*} size 
   * @param {*} data 
   */
  draw(size, data) {
    this.size = size;
    this.cellSize = this.$el.clientWidth / this.size;
    this.nullPos = data && data.nullPos || { x: 0, y: 0 };
    this.arr = data && data.arr || this.generateArray();

    this.drawCells();
  }

  /**
   * Изменение размеров поля
   * @param {*} size 
   */
  changeSize(size) {
    if (this.size !== size) {
      this.sizeChanged = true;

      this.draw(size);
    }
  }

  redraw() {
    if (this.sizeChanged) {
      this.sizeChanged = false;

      this.shuffle();
    }
  }

  /**
   * Проверяет можно ли передвинуть элемент
   * @param {*} pos – позиция клика
   * @param {*} index 
   */
  checkAction(pos, index) {
    if (isNaN(index)) return; // Игнорируем пустую ячейку

    // Проверка по горизонтали
    if (pos.y === this.nullPos.y) {
      if (pos.x - 1 === this.nullPos.x || pos.x + 1 === this.nullPos.x) {
        this.move(index, this.nullPos);
      } else {
        this.wrongMove(index);
      }
    }
    // Проверка по вертикали
    else if (pos.x === this.nullPos.x) {
      if (pos.y - 1 === this.nullPos.y || pos.y + 1 === this.nullPos.y) {
        this.move(index, this.nullPos);
      } else {
        this.wrongMove(index);
      }
    } else {
      this.wrongMove(index);
    }
  }

  /**
   * Обработчик перемещения элемента
   * Обновляет данные о позиции в массиве
   * @param {*} index 
   */
  move(index) {
    // Свапаем позиции
    [this.arr[index], this.nullPos] = [this.nullPos, this.arr[index]];
    this.arr[this.arr.length - 1] = this.nullPos;

    const newOffset = this.getOffset(this.arr[index]);

    this.animate(400);

    // Меняем позицию элемента
    this.$el.children[index].style.top = newOffset.top;
    this.$el.children[index].style.left = newOffset.left;
    // Меняем данные о текущей ячейке у элемента
    this.$el.children[index].dataset.x = this.arr[index].x;
    this.$el.children[index].dataset.y = this.arr[index].y;

    this.addToHistory();
  }

  /**
   * Обрабочик неправильного хода. Запускает тряску элемента
   * @param {*} index 
   */
  wrongMove(index) {
    this.$el.children[index].classList.remove('shake');
    // Таймпаут для перезапуска анимации
    setTimeout(() => {
      this.$el.children[index].classList.add('shake');
    }, 50);
  }

  /**
   * Получить индекс строки
   * @param {*} index 
   */
  getRowByIndex(index) {
    return index / this.size | 0;
  }

  /**
   * Получить индекс столбца
   * @param {*} index 
   */
  getColByIndex(index) {
    return index % this.size;
  }

  /**
   * Генерирует базовый массив с координатами
   */
  generateArray() {
    const res = [];

    for (let i = 0; i < this.size ** 2; i++) {
      res.push({
        x: this.getColByIndex(i),
        y: this.getRowByIndex(i)
      });
    }

    return res;
  }

  /**
   * Возвращает перемешанный массив с координатами
   */
  getMixedArr() {
    const mixedArr = [...this.arr];

    mixedArr.forEach((_, i) => {
      const random = Math.floor(Math.random() * mixedArr.length);

      [mixedArr[i], mixedArr[random]] = [mixedArr[random], mixedArr[i]]
    })

    // Первая ячейка должна быть пустой
    const nullCellIndex = mixedArr.findIndex(pos => pos.x === 0 && pos.y === 0);
    [mixedArr[mixedArr.length - 1], mixedArr[nullCellIndex]] = [mixedArr[nullCellIndex], mixedArr[mixedArr.length - 1]]

    return mixedArr;
  }

  /**
   * Получить смещение элемента
   */
  getOffset = (pos) => {
    return {
      top: pos.y * this.cellSize,
      left: pos.x * this.cellSize
    }
  }

  /**
   * Отрисовка элементов
   */
  drawCells() {
    this.$el.innerHTML = '';

    this.arr.forEach((pos, index) => {
      const cell = document.createElement('DIV');
      const topOffset = pos.y * this.cellSize;
      const leftOffset = pos.x * this.cellSize;

      if (index !== this.size ** 2 - 1) {
        cell.classList.add('cell');
        cell.style.width = `${100 / this.size}%`;
        cell.style.height = `${100 / this.size}%`;
        cell.style.top = `${topOffset}px`;
        cell.style.left = `${leftOffset}px`;
        cell.style['background-image'] = `url(${this.imageUrl})`;
        cell.style['background-size'] = `${this.size * this.cellSize}px ${this.size * this.cellSize}px`;
        cell.style['background-position'] = `-${this.getColByIndex(index) * this.cellSize}px -${this.getRowByIndex(index) * this.cellSize}px`;
        cell.dataset.x = pos.x;
        cell.dataset.y = pos.y;
        cell.dataset.index = index;
      }

      this.$el.appendChild(cell)
    })
  }

  /**
   * Изменение размеров области
   */
  resize = () => {
    const width = this.$el.parentNode.clientWidth;

    this.$el.style.width = width;
    this.$el.style.height = width;

    this.cellSize = width / this.size;

    for (let i = 0; i < this.size ** 2; i++) {
      const cell = this.$el.children[i];
      const topOffset = cell.dataset.y * this.cellSize;
      const leftOffset = cell.dataset.x * this.cellSize;
      
      cell.style.top = `${topOffset}px`;
      cell.style.left = `${leftOffset}px`;
      cell.style['background-size'] = `${this.size * this.cellSize}px ${this.size * this.cellSize}px`;
      cell.style['background-position'] = `-${this.getColByIndex(cell.dataset.index) * this.cellSize}px 
      -${this.getRowByIndex(cell.dataset.index) * this.cellSize}px`;
    }
  }

  /**
   * Перемешать элементы по полю
   */
  shuffle() {
    this.arr = this.getMixedArr();
    const shuffledPos = this.arr.map(this.getOffset);

    this.addToHistory();

    // Запус перемешивания через секунду
    setTimeout(() => {
      this.animate(600);

      for (let i = 0; i < this.size ** 2; i++) {
        this.$el.children[i].style.top = shuffledPos[i].top;
        this.$el.children[i].style.left = shuffledPos[i].left;
        this.$el.children[i].dataset.x = this.arr[i].x;
        this.$el.children[i].dataset.y = this.arr[i].y;
      }
    }, 1000);
  }

  /**
   * Метод устанавливает transition для выполенения плавного перемещения
   * Затем снимает, так как transition будет мешать изменению размеров в resize
   * @param {*} time 
   */
  animate(time) {
    this.$el.style.transition = `${time}ms`;
    setTimeout(() => {
      this.$el.style.transition = 'none';
    }, time)
  }

  /**
   * Добавить состояние в историю
   */
  addToHistory() {
    const hash = btoa(JSON.stringify(this.arr));

    history.pushState({}, '', `#${hash}`);
  }

  /**
   * Загрузить состояние из hash
   */
  loadFromHistory() {
    try {
      const arr = JSON.parse(atob(location.hash.substr(1)));
      const size = Math.sqrt(arr.length);
      const nullPos = arr[arr.length - 1];

      this.$slider.value = size;

      this.draw(size, { arr, nullPos });
    } catch {
      this.create();
    }
  }
}

window.onload = function () {
  const puzzle = new Puzzle();

  if (location.hash.substr(1)) {
    puzzle.loadFromHistory();
  } else {
    puzzle.create();
  }

  window.addEventListener('popstate', function () {
    puzzle.loadFromHistory();
  });
}