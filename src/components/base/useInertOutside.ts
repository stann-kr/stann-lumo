import { useEffect, type RefObject } from 'react';

/**
 * 모달이 열린 동안 `<body>`의 나머지 자식을 inert로 만들어 키보드와 스크린리더가 뒤 화면에 닿지 않게 한다.
 * `layerRef`는 portal로 `<body>`에 직접 붙인 모달 레이어를 가리켜야 한다.
 * 닫을 때는 여기서 붙인 inert만 떼므로, 원래 inert였던 요소는 그대로 남는다.
 * inert가 된 요소는 포커스를 잃을 수 있으니, 포커스를 돌려줄 요소를 기록하는 effect보다 뒤에 선언한다.
 */
export function useInertOutside(layerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const layer = layerRef.current;
    if (!active || !layer) return;

    const outside = Array.from(document.body.children).filter(
      (element) => !element.contains(layer) && !element.hasAttribute('inert'),
    );
    for (const element of outside) element.setAttribute('inert', '');

    return () => {
      for (const element of outside) element.removeAttribute('inert');
    };
  }, [active, layerRef]);
}
