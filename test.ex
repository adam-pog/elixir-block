defmodule Pmap do
  def map(list, func) do
    tasks = Enum.map(list, fn(item) ->
      Task.async(fn ->
        func.(item)
      end)
    end)

    tasks |> Enum.map(fn(task) ->
      Task.await(task)
    end)

    fn (x) -> "h" end
  end

  def lolmap, do: "hello"
end
